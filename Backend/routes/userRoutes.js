const express = require("express");
const { register, login, getUser } = require("../controllers/userController");
const authenticate = require("../middleware/auth");

const router = express.Router();

// Route pour l'inscription d'un utilisateur
router.post("/register", register);

// Route pour la connexion d'un utilisateur
router.post("/login", login);

// Route protégée pour récupérer les informations de l'utilisateur connecté
router.get("/me", authenticate, getUser);

module.exports = router;