const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const getDashboard = async (req, res) => {
  try {
    const { id: userId, role } = req.user

    // Buscar equipes do usuário
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    // Contar feedbacks recebidos
    const feedbacksReceived = await prisma.feedback.count({
      where: { toUserId: userId },
    })

    // Contar feedbacks pendentes (que o usuário recebeu)
    const pendingFeedbacks = await prisma.feedback.count({
      where: {
        toUserId: userId,
        status: "PENDING",
      },
    })

    // Estatísticas adicionais para ADMIN e MANAGER
    let additionalStats = {}

    if (role === "ADMIN") {
      // Estatísticas globais para ADMIN
      const totalUsers = await prisma.user.count()
      const totalTeams = await prisma.team.count()
      const totalFeedbacks = await prisma.feedback.count()

      const feedbacksByStatus = await prisma.feedback.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
      })

      const feedbacksByPriority = await prisma.feedback.groupBy({
        by: ["priority"],
        _count: {
          priority: true,
        },
      })

      additionalStats = {
        totalUsers,
        totalTeams,
        totalFeedbacks,
        feedbacksByStatus,
        feedbacksByPriority,
      }
    } else if (role === "MANAGER") {
      // Estatísticas das equipes para MANAGER
      const teamIds = userTeams.map((ut) => ut.team.id)

      const teamMembers = await prisma.teamMember.findMany({
        where: { teamId: { in: teamIds } },
        select: { userId: true },
      })

      const memberIds = teamMembers.map((tm) => tm.userId)

      const teamFeedbacks = await prisma.feedback.count({
        where: {
          OR: [{ fromUserId: { in: memberIds } }, { toUserId: { in: memberIds } }],
        },
      })

      const teamPendingFeedbacks = await prisma.feedback.count({
        where: {
          OR: [{ fromUserId: { in: memberIds } }, { toUserId: { in: memberIds } }],
          status: "PENDING",
        },
      })

      additionalStats = {
        teamFeedbacks,
        teamPendingFeedbacks,
        totalTeamMembers: memberIds.length,
      }
    }

    const dashboardData = {
      user: {
        id: userId,
        role,
        totalTeams: userTeams.length,
        teams: userTeams.map((ut) => ut.team),
      },
      feedbacks: {
        received: feedbacksReceived,
        pending: pendingFeedbacks,
      },
      ...additionalStats,
    }

    res.json({
      success: true,
      data: dashboardData,
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

module.exports = {
  getDashboard,
}
