const express = require("express")
const { protect } = require("../middlewares/auth.middleware")
const { checkRole } = require("../middlewares/checkRole.middleware")
const {
  createFeedback,
  getAllFeedback,
  updateFeedbackStatus,
  addCommentToFeedback,
} = require("../controllers/feedback.controller")

const router = express.Router()

// Todas as rotas requerem autenticação
router.use(protect)

// POST /api/feedback - Criar feedback (todos os usuários)
router.post("/", createFeedback)

// GET /api/feedback - Listar feedbacks (todos os usuários, com filtros por role)
router.get("/", getAllFeedback)

// PUT /api/feedback/:id/status - Atualizar status (ADMIN, MANAGER)
router.put("/:id/status", checkRole(["ADMIN", "MANAGER"]), updateFeedbackStatus)

// POST /api/feedback/:id/comments - Adicionar comentário (todos os usuários)
router.post("/:id/comments", addCommentToFeedback)

module.exports = router
