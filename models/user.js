import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // 🔹 Identité
  platform_id: { type: String, required: true, unique: true },
  prenom: String,
  ville: String,
  langue: { type: String, default: 'fr' },
  
  // 🔹 Business
  typeCommerce: String,
  physiqueOnline: String,
  anciennete: String,
  
  // 🔹 Abonnement & Paiement
  plan: { type: String, default: 'EliteTrial' },
  essaiEliteStart: Date,
  essaiEliteEnd: Date,
  essaiLimitLevel: { type: Number, default: 1 },
  payment_status: {
    type: String,
    enum: ['inactive', 'pending', 'active', 'cancelled'],
    default: 'inactive'
  },
  subscription_start: Date,
  subscription_end: Date,
  last_payment_date: Date,
  payment_method: String,
  
  // 🔹 Données utilisation
  lastMessageAt: { type: Date, default: Date.now },
  notificationsEnabled: { type: Boolean, default: true },
  modeSenior: { type: Boolean, default: false },
  
  // 🔹 IA & Préférences
  iaHistory: [{
    type: { type: String },
    content: String,
    response: String,
    ts: { type: Date, default: Date.now }
  }],
  iaPreferences: {
    conseilsAimes: [String],
    conseilsIgnores: [String],
    tauxReponse: { type: Number, default: 0 }
  },
  
  // 🔹 Stock
  stock: [{
    produit: String,
    quantite: Number,
    alerte: Number,
    lastUpdated: { type: Date, default: Date.now }
  }],
  
  // 🔹 Promos en attente
  pendingPromos: [{
    content: String,
    sent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

userSchema.index({ lastMessageAt: -1 });

export default mongoose.model('User', userSchema);