const BusinessCard = require("../models/businessCard");

// ✅ FONCTION CORRIGÉE: Sauvegarder ou mettre à jour la carte de visite
exports.saveBusinessCard = async (req, res) => {
  try {
    const { cardImage, cardConfig } = req.body;
    const userId = req.userId;

    console.log("💾 Sauvegarde carte de visite pour userId:", userId);

    if (!cardImage) {
      return res.status(400).json({ message: "Image de la carte requise" });
    }

    // ✅ VALIDATION ET NETTOYAGE des actions
    let cleanedConfig = {
      showQR: true,
      qrPosition: 'bottom-right',
      qrSize: 150,
      actions: []
    };

    if (cardConfig) {
      cleanedConfig = {
        showQR: cardConfig.showQR !== undefined ? cardConfig.showQR : true,
        qrPosition: cardConfig.qrPosition || 'bottom-right',
        qrSize: cardConfig.qrSize || 150,
        actions: []
      };

      // ✅ NETTOYAGE des actions pour éviter les erreurs de validation
      if (cardConfig.actions && Array.isArray(cardConfig.actions)) {
        cleanedConfig.actions = cardConfig.actions
          .filter(action => action && typeof action === 'object')
          .map(action => ({
            id: Number(action.id) || Date.now(),
            type: action.type || 'download',
            file: action.file || '',
            url: action.url || '',
            delay: Number(action.delay) || 0,
            active: Boolean(action.active !== undefined ? action.active : true)
          }));
      }
    }

    console.log("🧹 Configuration nettoyée:", cleanedConfig);

    // Vérifier si une carte existe déjà pour cet utilisateur
    let businessCard = await BusinessCard.findOne({ userId });

    if (businessCard) {
      // ✅ MISE À JOUR avec upsert pour éviter les conflits
      businessCard = await BusinessCard.findOneAndUpdate(
        { userId },
        {
          cardImage,
          cardConfig: cleanedConfig,
          updatedAt: new Date()
        },
        { 
          new: true, 
          runValidators: true 
        }
      );
      
      console.log("✅ Carte de visite mise à jour");
      res.json({ 
        message: "Carte de visite mise à jour avec succès", 
        businessCard 
      });
    } else {
      // ✅ CRÉATION avec gestion d'erreur de duplication
      try {
        businessCard = new BusinessCard({
          userId,
          cardImage,
          cardConfig: cleanedConfig
        });

        await businessCard.save();
        
        console.log("✅ Nouvelle carte de visite créée");
        res.status(201).json({ 
          message: "Carte de visite créée avec succès", 
          businessCard 
        });
      } catch (duplicateError) {
        if (duplicateError.code === 11000) {
          // Conflit de duplication, essayer une mise à jour
          console.log("⚠️ Conflit de duplication, tentative de mise à jour...");
          businessCard = await BusinessCard.findOneAndUpdate(
            { userId },
            {
              cardImage,
              cardConfig: cleanedConfig,
              updatedAt: new Date()
            },
            { 
              new: true, 
              runValidators: true 
            }
          );
          
          res.json({ 
            message: "Carte de visite mise à jour avec succès", 
            businessCard 
          });
        } else {
          throw duplicateError;
        }
      }
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

// ✅ FONCTION CORRIGÉE: Mettre à jour seulement la configuration
exports.updateCardConfig = async (req, res) => {
  try {
    const { cardConfig } = req.body;
    const userId = req.userId;

    console.log("⚙️ Mise à jour config carte de visite pour userId:", userId);

    const businessCard = await BusinessCard.findOne({ userId });

    if (!businessCard) {
      return res.status(404).json({ message: "Aucune carte de visite trouvée" });
    }

    // ✅ NETTOYAGE de la configuration
    const cleanedConfig = {
      ...businessCard.cardConfig,
      ...cardConfig
    };

    // ✅ NETTOYAGE des actions si présentes
    if (cardConfig.actions && Array.isArray(cardConfig.actions)) {
      cleanedConfig.actions = cardConfig.actions
        .filter(action => action && typeof action === 'object')
        .map(action => ({
          id: Number(action.id) || Date.now(),
          type: action.type || 'download',
          file: action.file || '',
          url: action.url || '',
          delay: Number(action.delay) || 0,
          active: Boolean(action.active !== undefined ? action.active : true)
        }));
    }

    businessCard.cardConfig = cleanedConfig;
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