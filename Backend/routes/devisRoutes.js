const express = require("express");
const {
  createDevis,
  getUserDevis,
  getClientDevis, // ✅ NOUVEAU
  updateDevis,
  deleteDevis
} = require("../controllers/devisController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// 📌 Créer un devis (POST)
router.post("/", authMiddleware, createDevis);

// 📌 Voir tous les devis d'un utilisateur (GET)
router.get("/", authMiddleware, getUserDevis);

// 📌 ✅ NOUVEAU: Voir les devis d'un client spécifique (GET)
router.get("/client/:clientId", authMiddleware, getClientDevis);

// 📌 Modifier un devis existant (PUT)
router.put("/:id", authMiddleware, updateDevis);

// 📌 Supprimer un devis (DELETE)
router.delete("/:id", authMiddleware, deleteDevis);

module.exports = router;