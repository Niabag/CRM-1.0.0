const mongoose = require("mongoose");

const businessCardSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  cardImage: { 
    type: String, // Base64 de l'image
    required: true 
  },
  cardConfig: {
    showQR: { type: Boolean, default: true },
    qrPosition: { type: String, default: 'bottom-right' },
    qrSize: { type: Number, default: 150 },
    actions: [{
      id: Number,
      type: String,
      file: String,
      url: String,
      delay: Number,
      active: Boolean
    }]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware pour mettre à jour updatedAt
businessCardSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("BusinessCard", businessCardSchema);