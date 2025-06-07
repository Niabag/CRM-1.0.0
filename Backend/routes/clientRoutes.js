const express = require("express");
const { registerClient, getClients } = require("../controllers/clientController");
const authMiddleware = require("../middleware/auth");
const { deleteClient } = require("../controllers/clientController");


const router = express.Router();

// 📌 Un client peut s'enregistrer en passant un userId dans le lien
router.post("/register/:userId", registerClient);

// 📌 Un utilisateur connecté peut voir SES clients
router.get("/", authMiddleware, getClients);

router.delete("/:id", authMiddleware, deleteClient);

module.exports = router;
