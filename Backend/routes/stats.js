const express = require('express');
const Client = require('../models/client');
const Devis = require('../models/devis');
const BusinessCard = require('../models/businessCard');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/stats/clients
// @desc    Obtenir les statistiques des clients
// @access  Private
router.get('/clients', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Compter les clients par statut
    const clientStats = await Client.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Transformer en objet
    const stats = {
      total: 0,
      nouveau: 0,
      active: 0,
      inactive: 0,
      pending: 0
    };

    clientStats.forEach(stat => {
      stats[stat._id] = stat.count;
      stats.total += stat.count;
    });

    res.json(stats);
  } catch (error) {
    console.error('Erreur stats clients:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/stats/devis
// @desc    Obtenir les statistiques des devis
// @access  Private
router.get('/devis', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    const devisStats = await Devis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalTTC' }
        }
      }
    ]);

    const stats = {
      total: 0,
      brouillon: 0,
      envoye: 0,
      accepte: 0,
      refuse: 0,
      totalCA: 0
    };

    devisStats.forEach(stat => {
      stats[stat._id] = stat.count;
      stats.total += stat.count;
      if (stat._id === 'accepte') {
        stats.totalCA += stat.totalAmount;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Erreur stats devis:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/stats/analytics
// @desc    Obtenir les analytics complètes
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Stats clients
    const clientsByStatus = await Client.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Stats devis
    const devisByStatus = await Devis.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalTTC' }
        }
      }
    ]);

    // Totaux
    const totalClients = await Client.countDocuments({ userId });
    const totalDevis = await Devis.countDocuments({ userId });
    const totalCA = await Devis.aggregate([
      { $match: { userId: userId, status: 'accepte' } },
      { $group: { _id: null, total: { $sum: '$totalTTC' } } }
    ]);

    // Données mensuelles (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await Client.aggregate([
      { $match: { userId: userId, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          clients: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Transformer les données
    const clientsByStatusObj = {};
    clientsByStatus.forEach(item => {
      clientsByStatusObj[item._id] = item.count;
    });

    const devisByStatusObj = {};
    devisByStatus.forEach(item => {
      devisByStatusObj[item._id] = item.count;
    });

    const analytics = {
      totalClients,
      totalDevis,
      totalCA: totalCA[0]?.total || 0,
      conversionRate: totalClients > 0 ? Math.round((totalDevis / totalClients) * 100) : 0,
      clientsByStatus: clientsByStatusObj,
      devisByStatus: devisByStatusObj,
      monthlyData: monthlyData.map(item => ({
        month: `${item._id.month}/${item._id.year}`,
        clients: item.clients,
        devis: 0, // À implémenter si nécessaire
        ca: 0 // À implémenter si nécessaire
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Erreur analytics:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;