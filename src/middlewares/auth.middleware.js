const { verifyToken } = require("../utils/jwt.utils")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
      },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      })
    }

    if (user.status !== "ACTIVE") {
      return res.status(401).json({
        success: false,
        message: "Account is not active.",
      })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    })
  }
}

module.exports = { protect }
