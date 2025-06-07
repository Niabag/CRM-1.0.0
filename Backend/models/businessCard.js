const mongoose = require("mongoose");

// ✅ SCHÉMA CORRIGÉ: Définition plus flexible pour les actions
const actionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['download', 'form', 'redirect', 'website']
  },
  file: { type: String, default: '' },
  url: { type: String, default: '' },
  delay: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, { _id: false }); // ✅ Pas d'_id automatique pour les sous-documents

const businessCardSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    unique: true // ✅ Un seul document par utilisateur
  },
  cardImage: { 
    type: String, // Base64 de l'image
    required: true 
  },
  cardConfig: {
    showQR: { type: Boolean, default: true },
    qrPosition: { 
      type: String, 
      default: 'bottom-right',
      enum: ['bottom-right', 'bottom-left', 'top-right', 'top-left']
    },
    qrSize: { type: Number, default: 150, min: 100, max: 200 },
    actions: [actionSchema] // ✅ Utilisation du schéma défini
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ Index pour optimiser les requêtes
businessCardSchema.index({ userId: 1 });

// Middleware pour mettre à jour updatedAt
businessCardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("BusinessCard", businessCardSchema);