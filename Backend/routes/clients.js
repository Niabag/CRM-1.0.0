const express = require('express');
const Client = require('../models/client');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET /api/clients
// @desc    Obtenir tous les clients de l'utilisateur avec pagination
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    // Construire le filtre
    let filter = { userId: req.user.userId };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    // Compter le total
    const total = await Client.countDocuments(filter);

    // Récupérer les clients
    const clients = await Client.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      clients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Erreur récupération clients:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   GET /api/clients/:id
// @desc    Obtenir un client spécifique
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    res.json(client);
  } catch (error) {
    console.error('Erreur récupération client:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   POST /api/clients
// @desc    Créer un nouveau client
// @access  Public (pour les inscriptions via carte de visite)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, notes, source, businessCardId } = req.body;

    // Si c'est une inscription via carte de visite, pas besoin d'auth
    let userId;
    if (source === 'business_card' && businessCardId) {
      const BusinessCard = require('../models/businessCard');
      const businessCard = await BusinessCard.findById(businessCardId);
      if (!businessCard) {
        return res.status(404).json({ message: 'Carte de visite non trouvée' });
      }
      userId = businessCard.userId;
    } else {
      // Sinon, vérifier l'authentification
      const authMiddleware = require('../middleware/auth');
      return authMiddleware(req, res, async () => {
        userId = req.user.userId;
        await createClient();
      });
    }

    const createClient = async () => {
      // Vérifier si le client existe déjà
      const existingClient = await Client.findOne({ email, userId });
      if (existingClient) {
        return res.status(400).json({ message: 'Un client avec cet email existe déjà' });
      }

      const client = new Client({
        name,
        email,
        phone,
        company,
        notes,
        source: source || 'manual',
        businessCardId,
        userId
      });

      await client.save();

      res.status(201).json({
        message: 'Client créé avec succès',
        client
      });
    };

    if (userId) {
      await createClient();
    }
  } catch (error) {
    console.error('Erreur création client:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   PUT /api/clients/:id
// @desc    Mettre à jour un client
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, phone, company, notes, status, address, tags } = req.body;

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { name, email, phone, company, notes, status, address, tags },
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    res.json(client);
  } catch (error) {
    console.error('Erreur mise à jour client:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// @route   DELETE /api/clients/:id
// @desc    Supprimer un client
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    res.json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression client:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;