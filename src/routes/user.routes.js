const express = require("express")
const { protect } = require("../middlewares/auth.middleware")
const { checkRole } = require("../middlewares/checkRole.middleware")
const { getAllUsers, getUserById, updateUser, deleteUser } = require("../controllers/user.controller")

const router = express.Router()

// Todas as rotas de usuário requerem autenticação de ADMIN
router.use(protect)
router.use(checkRole(["ADMIN"]))

// GET /api/users
router.get("/", getAllUsers)

// GET /api/users/:id
router.get("/:id", getUserById)

// PUT /api/users/:id
router.put("/:id", updateUser)

// DELETE /api/users/:id
router.delete("/:id", deleteUser)

module.exports = router
