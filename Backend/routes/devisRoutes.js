const express = require("express");
const {
  createDevis,
  getUserDevis,
  updateDevis,
  deleteDevis // ✅ important : bien importer deleteDevis ici
} = require("../controllers/devisController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// 📌 Créer un devis (POST)
router.post("/", authMiddleware, createDevis);

// 📌 Voir tous les devis d’un utilisateur (GET)
router.get("/", authMiddleware, getUserDevis);

// 📌 Modifier un devis existant (PUT)
router.put("/:id", authMiddleware, updateDevis);

router.delete("/:id", authMiddleware, deleteDevis);


module.exports = router;
