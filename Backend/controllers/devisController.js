const Devis = require("../models/devis");

exports.createDevis = async (req, res) => {
  try {
    const {
      title,
      description,
      amount,
      clientId,
      dateDevis,
      dateValidite,
      tvaRate,
      entrepriseName,
      entrepriseAddress,
      entrepriseCity,
      entreprisePhone,
      entrepriseEmail,
      logoUrl, // ✅
      articles = [],
    } = req.body;

    const userId = req.userId;

    if (!clientId) {
      return res.status(400).json({ message: "Client manquant." });
    }

    const newDevis = new Devis({
      title,
      description,
      amount,
      clientId,
      userId,
      dateDevis,
      dateValidite,
      tvaRate,
      entrepriseName,
      entrepriseAddress,
      entrepriseCity,
      entreprisePhone,
      entrepriseEmail,
      logoUrl, // ✅
      articles,
    });

    await newDevis.save();
    res.status(201).json({ message: "✅ Devis créé avec succès", devis: newDevis });
  } catch (error) {
    console.error("❌ Erreur création devis :", error);
    res.status(500).json({
      message: "Erreur lors de la création du devis",
      error,
    });
  }
};


exports.getUserDevis = async (req, res) => {
  try {
    const devisList = await Devis.find({ userId: req.userId })
      .populate("clientId", "name email");
    res.json(devisList);
  } catch (error) {
    console.error("Erreur récupération devis :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des devis", error });
  }
};

exports.updateDevis = async (req, res) => {
  try {
    const devisId = req.params.id;

    const updatedDevis = await Devis.findByIdAndUpdate(
      devisId,
      req.body,
      { new: true }
    );

    if (!updatedDevis) {
      return res.status(404).json({ message: "Devis introuvable." });
    }

    res.json(updatedDevis);
  } catch (error) {
    console.error("❌ Erreur mise à jour devis :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du devis", error });
  }
};

exports.deleteDevis = async (req, res) => {
  try {
    const devis = await Devis.findById(req.params.id);
    if (!devis) {
      return res.status(404).json({ message: "Devis introuvable." });
    }

    // Optionnel : vérifie si c'est bien l'utilisateur qui a créé ce devis
    if (devis.userId.toString() !== req.userId) {
      console.log("🔐 User ID du token :", req.userId);
console.log("📄 User ID du devis :", devis.userId);
      return res.status(403).json({ message: "Accès interdit." });
    }

    await devis.deleteOne();
    res.status(200).json({ message: "✅ Devis supprimé avec succès." });
  } catch (error) {
    console.error("❌ Erreur suppression devis :", error);
    res.status(500).json({ message: "Erreur lors de la suppression du devis." });
  }
};
