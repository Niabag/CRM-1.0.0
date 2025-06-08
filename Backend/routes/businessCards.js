const express = require('express');
const router = express.Router();
const BusinessCard = require('../models/BusinessCard');
const auth = require('../middleware/auth');

// ✅ NOUVEAU: Route publique pour récupérer les données de carte par userId
router.get('/public/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 Récupération publique des données de carte pour userId:', userId);
    
    const businessCard = await BusinessCard.findOne({ userId });
    
    if (!businessCard) {
      console.log('ℹ️ Aucune carte trouvée pour cet utilisateur');
      return res.status(404).json({ message: 'Aucune carte de visite trouvée' });
    }
    
    console.log('✅ Carte trouvée avec actions:', businessCard.cardConfig?.actions?.length || 0);
    
    res.json(businessCard);
  } catch (error) {
    console.error('❌ Erreur récupération carte publique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route protégée pour récupérer les données de l'utilisateur connecté
router.get('/', auth, async (req, res) => {
  try {
    const businessCard = await BusinessCard.findOne({ userId: req.user.userId });
    
    if (!businessCard) {
      return res.status(404).json({ message: 'Aucune carte de visite trouvée' });
    }
    
    res.json(businessCard);
  } catch (error) {
    console.error('Erreur récupération carte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer ou mettre à jour une carte de visite
router.post('/', auth, async (req, res) => {
  try {
    const { cardImage, cardConfig } = req.body;
    
    let businessCard = await BusinessCard.findOne({ userId: req.user.userId });
    
    if (businessCard) {
      // Mettre à jour
      businessCard.cardImage = cardImage || businessCard.cardImage;
      businessCard.cardConfig = cardConfig || businessCard.cardConfig;
      businessCard.updatedAt = new Date();
    } else {
      // Créer
      businessCard = new BusinessCard({
        userId: req.user.userId,
        cardImage,
        cardConfig
      });
    }
    
    await businessCard.save();
    
    console.log('✅ Carte de visite sauvegardée avec actions:', cardConfig?.actions?.length || 0);
    
    res.json({ 
      message: 'Carte de visite sauvegardée',
      businessCard 
    });
  } catch (error) {
    console.error('Erreur sauvegarde carte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;