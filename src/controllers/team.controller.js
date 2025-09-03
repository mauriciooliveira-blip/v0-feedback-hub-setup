const Joi = require("joi")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

// Schemas de validação
const createTeamSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional(),
})

const addMemberSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  roleInTeam: Joi.string().min(2).max(50).required(),
})

const createTeam = async (req, res) => {
  try {
    // Validação
    const { error, value } = createTeamSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }

    const { name, description } = value

    // Criar equipe
    const team = await prisma.team.create({
      data: {
        name,
        description,
      },
    })

    res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: team,
    })
  } catch (error) {
    console.error("Create team error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

const getAllTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.json({
      success: true,
      data: teams,
    })
  } catch (error) {
    console.error("Get teams error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

const addMemberToTeam = async (req, res) => {
  try {
    const { id } = req.params
    const teamId = Number.parseInt(id)

    if (isNaN(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID",
      })
    }

    // Validação
    const { error, value } = addMemberSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }

    const { userId, roleInTeam } = value

    // Verificar se equipe existe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    })

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      })
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Verificar se usuário já é membro da equipe
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    })

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this team",
      })
    }

    // Adicionar membro à equipe
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
        roleInTeam,
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
      message: "Member added to team successfully",
      data: teamMember,
    })
  } catch (error) {
    console.error("Add member error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

const removeMemberFromTeam = async (req, res) => {
  try {
    const { id, memberId } = req.params
    const teamId = Number.parseInt(id)
    const userId = Number.parseInt(memberId)

    if (isNaN(teamId) || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID or member ID",
      })
    }

    // Verificar se membro existe na equipe
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    })

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: "Member not found in this team",
      })
    }

    // Remover membro da equipe
    await prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    })

    res.json({
      success: true,
      message: "Member removed from team successfully",
    })
  } catch (error) {
    console.error("Remove member error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

module.exports = {
  createTeam,
  getAllTeams,
  addMemberToTeam,
  removeMemberFromTeam,
}
