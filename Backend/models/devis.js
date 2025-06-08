const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères']
  },
  quantity: {
    type: Number,
    required: [true, 'La quantité est requise'],
    min: [0, 'La quantité ne peut pas être négative'],
    default: 1
  },
  unitPrice: {
    type: Number,
    required: [true, 'Le prix unitaire est requis'],
    min: [0, 'Le prix unitaire ne peut pas être négatif'],
    default: 0
  },
  tva: {
    type: Number,
    required: [true, 'Le taux de TVA est requis'],
    min: [0, 'Le taux de TVA ne peut pas être négatif'],
    max: [100, 'Le taux de TVA ne peut pas dépasser 100%'],
    default: 20
  },
  total: {
    type: Number,
    default: 0
  }
});

const devisSchema = new mongoose.Schema({
  devisNumber: {
    type: String,
    required: [true, 'Le numéro de devis est requis'],
    unique: true,
    trim: true
  },
  clientName: {
    type: String,
    required: [true, 'Le nom du client est requis'],
    trim: true
  },
  clientEmail: {
    type: String,
    required: [true, 'L\'email du client est requis'],
    lowercase: true,
    trim: true
  },
  clientAddress: {
    type: String,
    trim: true
  },
  clientId: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    required: [true, 'Le nom de l\'entreprise est requis'],
    trim: true,
    default: 'Mon Entreprise'
  },
  companyAddress: {
    type: String,
    trim: true,
    default: 'Adresse de l\'entreprise'
  },
  companyPhone: {
    type: String,
    trim: true,
    default: '01 23 45 67 89'
  },
  companyEmail: {
    type: String,
    trim: true,
    default: 'contact@monentreprise.fr'
  },
  date: {
    type: Date,
    required: [true, 'La date est requise'],
    default: Date.now
  },
  validityDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['brouillon', 'envoye', 'accepte', 'refuse'],
    default: 'brouillon'
  },
  articles: [articleSchema],
  totalHT: {
    type: Number,
    default: 0,
    min: [0, 'Le total HT ne peut pas être négatif']
  },
  totalTVA: {
    type: Number,
    default: 0,
    min: [0, 'Le total TVA ne peut pas être négatif']
  },
  totalTTC: {
    type: Number,
    default: 0,
    min: [0, 'Le total TTC ne peut pas être négatif']
  },
  conditions: {
    type: String,
    trim: true,
    default: 'Conditions générales de vente...'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sentAt: {
    type: Date
  },
  acceptedAt: {
    type: Date
  },
  refusedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
devisSchema.index({ userId: 1, devisNumber: 1 });
devisSchema.index({ userId: 1, status: 1 });
devisSchema.index({ userId: 1, createdAt: -1 });

// Middleware pour calculer les totaux avant sauvegarde
devisSchema.pre('save', function(next) {
  let totalHT = 0;
  let totalTVA = 0;

  this.articles.forEach(article => {
    const articleTotal = article.quantity * article.unitPrice;
    const articleTVA = articleTotal * (article.tva / 100);
    
    article.total = articleTotal;
    totalHT += articleTotal;
    totalTVA += articleTVA;
  });

  this.totalHT = Math.round(totalHT * 100) / 100;
  this.totalTVA = Math.round(totalTVA * 100) / 100;
  this.totalTTC = Math.round((totalHT + totalTVA) * 100) / 100;

  next();
});

// Méthode pour changer le statut
devisSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  switch (newStatus) {
    case 'envoye':
      this.sentAt = new Date();
      break;
    case 'accepte':
      this.acceptedAt = new Date();
      break;
    case 'refuse':
      this.refusedAt = new Date();
      break;
  }
};

module.exports = mongoose.model('Devis', devisSchema);