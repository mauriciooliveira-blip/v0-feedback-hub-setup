const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
require("dotenv").config()

// Import routes
const authRoutes = require("./src/routes/auth.routes")
const userRoutes = require("./src/routes/user.routes")
const teamRoutes = require("./src/routes/team.routes")
const feedbackRoutes = require("./src/routes/feedback.routes")
const reportRoutes = require("./src/routes/report.routes")

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares globais
app.use(helmet())
app.use(cors())
app.use(morgan("combined"))
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "FeedbackHub API is running",
    timestamp: new Date().toISOString(),
  })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/teams", teamRoutes)
app.use("/api/feedback", feedbackRoutes)
app.use("/api/reports", reportRoutes)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

app.listen(PORT, () => {
  console.log(`🚀 FeedbackHub API running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})
