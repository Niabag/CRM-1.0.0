const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
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
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'L\'adresse ne peut pas dépasser 500 caractères']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Les notes ne peuvent pas dépasser 1000 caractères']
  },
  status: {
    type: String,
    enum: ['nouveau', 'active', 'inactive', 'pending'],
    default: 'nouveau'
  },
  source: {
    type: String,
    enum: ['manual', 'business_card', 'website', 'referral', 'other'],
    default: 'manual'
  },
  businessCardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessCard'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  lastContact: {
    type: Date
  },
  nextFollowUp: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
clientSchema.index({ userId: 1, email: 1 });
clientSchema.index({ userId: 1, status: 1 });
clientSchema.index({ userId: 1, createdAt: -1 });

// Méthode pour obtenir le nom complet
clientSchema.virtual('fullName').get(function() {
  return this.name;
});

// Méthode pour vérifier si le client est actif
clientSchema.methods.isActive = function() {
  return this.status === 'active';
};

module.exports = mongoose.model('Client', clientSchema);