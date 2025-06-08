const express = require('express');
const Devis = require('../models/devis');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/devis
// @desc    Obtenir tous les devis de l'utilisateur
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status || '';

    let filter = { userId: req.user.userId };

    if (status) {
      filter.status = status;
    }

    const total = await Devis.countDocuments(filter);
    const devis = await Devis.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      devis,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Erreur récupération devis:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/devis/:id
// @desc    Obtenir un devis spécifique
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const devis = await Devis.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!devis) {
      return res.status(404).json({ message: 'Devis non trouvé' });
    }

    res.json(devis);
  } catch (error) {
    console.error('Erreur récupération devis:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/devis
// @desc    Créer un nouveau devis
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const devisData = {
      ...req.body,
      userId: req.user.userId
    };

    const devis = new Devis(devisData);
    await devis.save();

    res.status(201).json({
      message: 'Devis créé avec succès',
      devis
    });
  } catch (error) {
    console.error('Erreur création devis:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/devis/:id
// @desc    Mettre à jour un devis
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const devis = await Devis.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!devis) {
      return res.status(404).json({ message: 'Devis non trouvé' });
    }

    res.json(devis);
  } catch (error) {
    console.error('Erreur mise à jour devis:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/devis/:id
// @desc    Supprimer un devis
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const devis = await Devis.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!devis) {
      return res.status(404).json({ message: 'Devis non trouvé' });
    }

    res.json({ message: 'Devis supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression devis:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;