const express = require("express");
const { register, login } = require("../controllers/userController");
const authenticate = require("../middleware/auth");

const router = express.Router();

// Route pour l'inscription d'un utilisateur
router.post("/register", register);

// Route pour la connexion d'un utilisateur
router.post("/login", login);

// Route protégée pour récupérer les informations de l'utilisateur connecté
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json({
      userId: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
