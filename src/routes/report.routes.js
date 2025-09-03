const express = require("express")
const { protect } = require("../middlewares/auth.middleware")
const { getDashboard } = require("../controllers/report.controller")

const router = express.Router()

// Todas as rotas requerem autenticação
router.use(protect)

// GET /api/reports/dashboard
router.get("/dashboard", getDashboard)

module.exports = router
