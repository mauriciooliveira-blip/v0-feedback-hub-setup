const express = require("express")
const { protect } = require("../middlewares/auth.middleware")
const { checkRole } = require("../middlewares/checkRole.middleware")
const { createTeam, getAllTeams, addMemberToTeam, removeMemberFromTeam } = require("../controllers/team.controller")

const router = express.Router()

// Todas as rotas requerem autenticação
router.use(protect)

// POST /api/teams - Criar equipe (ADMIN, MANAGER)
router.post("/", checkRole(["ADMIN", "MANAGER"]), createTeam)

// GET /api/teams - Listar equipes (todos os usuários autenticados)
router.get("/", getAllTeams)

// POST /api/teams/:id/members - Adicionar membro (ADMIN, MANAGER)
router.post("/:id/members", checkRole(["ADMIN", "MANAGER"]), addMemberToTeam)

// DELETE /api/teams/:id/members/:memberId - Remover membro (ADMIN, MANAGER)
router.delete("/:id/members/:memberId", checkRole(["ADMIN", "MANAGER"]), removeMemberFromTeam)

module.exports = router
