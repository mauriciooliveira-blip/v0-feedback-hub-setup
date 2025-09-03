const Joi = require("joi")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

// Schemas de validação
const createFeedbackSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  content: Joi.string().min(10).max(2000).required(),
  type: Joi.string().min(2).max(50).required(),
  priority: Joi.string().valid("LOW", "MEDIUM", "HIGH", "CRITICAL").optional(),
  rating: Joi.number().integer().min(1).max(10).optional(),
  toUserId: Joi.number().integer().positive().required(),
})

const updateStatusSchema = Joi.object({
  status: Joi.string().valid("PENDING", "IN_ANALYSIS", "APPROVED", "REJECTED").required(),
})

const addCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
})

const createFeedback = async (req, res) => {
  try {
    // Validação
    const { error, value } = createFeedbackSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }

    const { title, content, type, priority = "MEDIUM", rating, toUserId } = value
    const fromUserId = req.user.id

    // Verificar se usuário destinatário existe
    const toUser = await prisma.user.findUnique({
      where: { id: toUserId },
    })

    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: "Recipient user not found",
      })
    }

    // Criar feedback
    const feedback = await prisma.feedback.create({
      data: {
        title,
        content,
        type,
        priority,
        rating,
        fromUserId,
        toUserId,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    res.status(201).json({
      success: true,
      message: "Feedback created successfully",
      data: feedback,
    })
  } catch (error) {
    console.error("Create feedback error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

const getAllFeedback = async (req, res) => {
  try {
    const { role, id: userId } = req.user
    let whereClause = {}

    // Lógica de permissão baseada no role
    if (role === "ADMIN") {
      // ADMIN vê todos os feedbacks
      whereClause = {}
    } else if (role === "MANAGER") {
      // MANAGER vê feedbacks de membros de suas equipes
      const userTeams = await prisma.teamMember.findMany({
        where: { userId },
        select: { teamId: true },
      })

      const teamIds = userTeams.map((tm) => tm.teamId)

      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId: { in: teamIds } },
        select: { userId: true },
      })

      const memberIds = teamMembers.map((tm) => tm.userId)

      whereClause = {
        OR: [{ fromUserId: { in: memberIds } }, { toUserId: { in: memberIds } }],
      }
    } else {
      // USER vê apenas feedbacks que enviou ou recebeu
      whereClause = {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      }
    }

    const feedbacks = await prisma.feedback.findMany({
      where: whereClause,
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.json({
      success: true,
      data: feedbacks,
    })
  } catch (error) {
    console.error("Get feedback error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params
    const feedbackId = Number.parseInt(id)

    if (isNaN(feedbackId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID",
      })
    }

    // Validação
    const { error, value } = updateStatusSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }

    const { status } = value

    // Verificar se feedback existe
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    })

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      })
    }

    // Atualizar status
    const updatedFeedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    res.json({
      success: true,
      message: "Feedback status updated successfully",
      data: updatedFeedback,
    })
  } catch (error) {
    console.error("Update feedback status error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

const addCommentToFeedback = async (req, res) => {
  try {
    const { id } = req.params
    const feedbackId = Number.parseInt(id)

    if (isNaN(feedbackId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID",
      })
    }

    // Validação
    const { error, value } = addCommentSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }

    const { content } = value
    const userId = req.user.id

    // Verificar se feedback existe
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    })

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      })
    }

    // Criar comentário
    const comment = await prisma.feedbackComment.create({
      data: {
        content,
        userId,
        feedbackId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    })
  } catch (error) {
    console.error("Add comment error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

module.exports = {
  createFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  addCommentToFeedback,
}
