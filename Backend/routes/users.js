const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Client = require('../models/client');
const Devis = require('../models/devis');
const BusinessCard = require('../models/businessCard');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/users/profile
// @desc    Obtenir le profil de l'utilisateur connecté
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/users/profile
// @desc    Mettre à jour le profil de l'utilisateur
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user.userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/users/password
// @desc    Changer le mot de passe
// @access  Private
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/users/export
// @desc    Exporter toutes les données de l'utilisateur
// @access  Private
router.get('/export', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const clients = await Client.find({ userId: req.user.userId });
    const devis = await Devis.find({ userId: req.user.userId });
    const businessCards = await BusinessCard.find({ userId: req.user.userId });

    const exportData = {
      user: user.toJSON(),
      clients,
      devis,
      businessCards,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    res.json(exportData);
  } catch (error) {
    console.error('Erreur export données:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/users/account
// @desc    Supprimer le compte utilisateur
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // Supprimer toutes les données associées
    await Client.deleteMany({ userId: req.user.userId });
    await Devis.deleteMany({ userId: req.user.userId });
    await BusinessCard.deleteMany({ userId: req.user.userId });
    await User.findByIdAndDelete(req.user.userId);

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression compte:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;