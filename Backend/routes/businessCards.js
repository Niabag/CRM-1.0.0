const express = require('express');
const BusinessCard = require('../models/businessCard');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/business-cards/my-card
// @desc    Obtenir la carte de visite de l'utilisateur
// @access  Private
router.get('/my-card', auth, async (req, res) => {
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

// @route   GET /api/business-cards/:id
// @desc    Obtenir une carte de visite par ID (public pour QR codes)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const businessCard = await BusinessCard.findById(req.params.id);
    
    if (!businessCard || !businessCard.isActive) {
      return res.status(404).json({ message: 'Carte de visite non trouvée' });
    }

    // Incrémenter le compteur de vues
    await businessCard.incrementView();

    res.json(businessCard);
  } catch (error) {
    console.error('Erreur récupération carte publique:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/business-cards
// @desc    Créer une nouvelle carte de visite
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    // Vérifier si l'utilisateur a déjà une carte
    const existingCard = await BusinessCard.findOne({ userId: req.user.userId });
    if (existingCard) {
      return res.status(400).json({ message: 'Vous avez déjà une carte de visite' });
    }

    const businessCard = new BusinessCard({
      ...req.body,
      userId: req.user.userId
    });

    await businessCard.save();

    res.status(201).json({
      message: 'Carte de visite créée avec succès',
      ...businessCard.toObject()
    });
  } catch (error) {
    console.error('Erreur création carte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/business-cards/:id
// @desc    Mettre à jour une carte de visite
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const businessCard = await BusinessCard.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!businessCard) {
      return res.status(404).json({ message: 'Carte de visite non trouvée' });
    }

    res.json(businessCard);
  } catch (error) {
    console.error('Erreur mise à jour carte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/business-cards/:id/generate-qr
// @desc    Générer l'URL du QR code
// @access  Private
router.post('/:id/generate-qr', auth, async (req, res) => {
  try {
    const businessCard = await BusinessCard.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!businessCard) {
      return res.status(404).json({ message: 'Carte de visite non trouvée' });
    }

    const qrUrl = businessCard.getQRUrl();

    res.json({ qrUrl });
  } catch (error) {
    console.error('Erreur génération QR:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/business-cards/:id
// @desc    Supprimer une carte de visite
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const businessCard = await BusinessCard.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!businessCard) {
      return res.status(404).json({ message: 'Carte de visite non trouvée' });
    }

    res.json({ message: 'Carte de visite supprimée avec succès' });
  } catch (error) {
    console.error('Erreur suppression carte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;