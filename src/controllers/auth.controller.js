const bcrypt = require("bcryptjs")
const Joi = require("joi")
const { PrismaClient } = require("@prisma/client")
const { generateToken } = require("../utils/jwt.utils")

const prisma = new PrismaClient()

// Schemas de validação
const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

const register = async (req, res) => {
  try {
    // Validação
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }

    const { firstName, lastName, email, password } = value

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Verificar se é o primeiro usuário (será ADMIN)
    const userCount = await prisma.user.count()
    const role = userCount === 0 ? "ADMIN" : "USER"

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    })

    // Gerar token
    const token = generateToken({ userId: user.id, role: user.role })

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user,
        token,
      },
    })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

const login = async (req, res) => {
  try {
    // Validação
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }

    const { email, password } = value

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      })
    }

    // Verificar status
    if (user.status !== "ACTIVE") {
      return res.status(401).json({
        success: false,
        message: "Account is not active",
      })
    }

    // Gerar token
    const token = generateToken({ userId: user.id, role: user.role })

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        token,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
}

module.exports = {
  register,
  login,
}
