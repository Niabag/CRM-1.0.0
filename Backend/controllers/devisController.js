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
      logoUrl,
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
      logoUrl,
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

exports.getClientDevis = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    // Vérifier que le client appartient à l'utilisateur connecté
    const Client = require("../models/client");
    const client = await Client.findOne({ _id: clientId, userId: req.userId });
    
    if (!client) {
      return res.status(404).json({ message: "Client introuvable ou non autorisé" });
    }

    // Récupérer uniquement les devis de ce client
    const devisList = await Devis.find({ 
      clientId: clientId,
      userId: req.userId 
    }).populate("clientId", "name email");
    
    res.json(devisList);
  } catch (error) {
    console.error("Erreur récupération devis client :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des devis du client", error });
  }
};

exports.updateDevis = async (req, res) => {
  try {
    const devisId = req.params.id;

    // Vérifier que le devis appartient à l'utilisateur
    const existingDevis = await Devis.findOne({ _id: devisId, userId: req.userId });
    if (!existingDevis) {
      return res.status(404).json({ message: "Devis introuvable ou non autorisé." });
    }

    const updatedDevis = await Devis.findByIdAndUpdate(
      devisId,
      req.body,
      { new: true }
    );

    res.json(updatedDevis);
  } catch (error) {
    console.error("❌ Erreur mise à jour devis :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du devis", error });
  }
};

exports.deleteDevis = async (req, res) => {
  try {
    const devis = await Devis.findOne({ _id: req.params.id, userId: req.userId });
    if (!devis) {
      return res.status(404).json({ message: "Devis introuvable ou non autorisé." });
    }

    await devis.deleteOne();
    res.status(200).json({ message: "✅ Devis supprimé avec succès." });
  } catch (error) {
    console.error("❌ Erreur suppression devis :", error);
    res.status(500).json({ message: "Erreur lors de la suppression du devis." });
  }
};