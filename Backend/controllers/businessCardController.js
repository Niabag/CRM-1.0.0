const BusinessCard = require("../models/businessCard");

// Sauvegarder ou mettre à jour la carte de visite
exports.saveBusinessCard = async (req, res) => {
  try {
    const { cardImage, cardConfig } = req.body;
    const userId = req.userId;

    console.log("💾 Sauvegarde carte de visite pour userId:", userId);

    if (!cardImage) {
      return res.status(400).json({ message: "Image de la carte requise" });
    }

    // Vérifier si une carte existe déjà pour cet utilisateur
    let businessCard = await BusinessCard.findOne({ userId });

    if (businessCard) {
      // Mettre à jour la carte existante
      businessCard.cardImage = cardImage;
      businessCard.cardConfig = cardConfig || businessCard.cardConfig;
      await businessCard.save();
      
      console.log("✅ Carte de visite mise à jour");
      res.json({ 
        message: "Carte de visite mise à jour avec succès", 
        businessCard 
      });
    } else {
      // Créer une nouvelle carte
      businessCard = new BusinessCard({
        userId,
        cardImage,
        cardConfig: cardConfig || {
          showQR: true,
          qrPosition: 'bottom-right',
          qrSize: 150,
          actions: []
        }
      });

      await businessCard.save();
      
      console.log("✅ Nouvelle carte de visite créée");
      res.status(201).json({ 
        message: "Carte de visite créée avec succès", 
        businessCard 
      });
    }

  } catch (error) {
    console.error("❌ Erreur sauvegarde carte de visite:", error);
    res.status(500).json({ 
      message: "Erreur lors de la sauvegarde de la carte de visite", 
      error: error.message 
    });
  }
};

// Récupérer la carte de visite de l'utilisateur
exports.getBusinessCard = async (req, res) => {
  try {
    const userId = req.userId;

    console.log("📋 Récupération carte de visite pour userId:", userId);

    const businessCard = await BusinessCard.findOne({ userId });

    if (!businessCard) {
      return res.status(404).json({ message: "Aucune carte de visite trouvée" });
    }

    console.log("✅ Carte de visite récupérée");
    res.json(businessCard);

  } catch (error) {
    console.error("❌ Erreur récupération carte de visite:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération de la carte de visite", 
      error: error.message 
    });
  }
};

// Supprimer la carte de visite
exports.deleteBusinessCard = async (req, res) => {
  try {
    const userId = req.userId;

    console.log("🗑️ Suppression carte de visite pour userId:", userId);

    const businessCard = await BusinessCard.findOneAndDelete({ userId });

    if (!businessCard) {
      return res.status(404).json({ message: "Aucune carte de visite trouvée" });
    }

    console.log("✅ Carte de visite supprimée");
    res.json({ message: "Carte de visite supprimée avec succès" });

  } catch (error) {
    console.error("❌ Erreur suppression carte de visite:", error);
    res.status(500).json({ 
      message: "Erreur lors de la suppression de la carte de visite", 
      error: error.message 
    });
  }
};

// Mettre à jour seulement la configuration
exports.updateCardConfig = async (req, res) => {
  try {
    const { cardConfig } = req.body;
    const userId = req.userId;

    console.log("⚙️ Mise à jour config carte de visite pour userId:", userId);

    const businessCard = await BusinessCard.findOne({ userId });

    if (!businessCard) {
      return res.status(404).json({ message: "Aucune carte de visite trouvée" });
    }

    businessCard.cardConfig = { ...businessCard.cardConfig, ...cardConfig };
    await businessCard.save();

    console.log("✅ Configuration carte de visite mise à jour");
    res.json({ 
      message: "Configuration mise à jour avec succès", 
      businessCard 
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour config carte de visite:", error);
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour de la configuration", 
      error: error.message 
    });
  }
};