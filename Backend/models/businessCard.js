const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['form', 'redirect', 'download'],
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileUrl: {
    type: String,
    trim: true
  },
  delay: {
    type: Number,
    default: 0,
    min: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
});

const businessCardSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Le nom de l\'entreprise est requis'],
    trim: true,
    maxlength: [100, 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères']
  },
  contactName: {
    type: String,
    required: [true, 'Le nom du contact est requis'],
    trim: true,
    maxlength: [100, 'Le nom du contact ne peut pas dépasser 100 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Le téléphone ne peut pas dépasser 20 caractères']
  },
  website: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'L\'adresse ne peut pas dépasser 500 caractères']
  },
  logo: {
    type: String, // Base64 ou URL
    trim: true
  },
  qrPosition: {
    type: String,
    enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
    default: 'bottom-right'
  },
  qrSize: {
    type: Number,
    default: 80,
    min: 60,
    max: 120
  },
  actions: [actionSchema],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastViewed: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
businessCardSchema.index({ userId: 1 });

// Méthode pour incrémenter le compteur de vues
businessCardSchema.methods.incrementView = function() {
  this.viewCount += 1;
  this.lastViewed = new Date();
  return this.save();
};

// Méthode pour obtenir l'URL du QR code
businessCardSchema.methods.getQRUrl = function() {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/register-client/${this._id}`;
};

module.exports = mongoose.model('BusinessCard', businessCardSchema);