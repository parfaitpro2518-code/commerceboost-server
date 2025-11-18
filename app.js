// app.js - VERSION COMPLÈTEMENT CORRIGÉE
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// Routes
import messengerRoutes from './routes/messenger.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payment.js';

// ⭐⭐ DÉFINIR PORT AU DÉBUT - TRÈS IMPORTANT ⭐⭐
const PORT = process.env.PORT || 10000;

// Charge les variables d'environnement
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/commerceboost';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => {
    console.error('❌ MongoDB erreur:', err);
    console.log('💡 Astuce: Vérifie ton MONGODB_URI dans le fichier .env');
  });

// Routes de base
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 CommerceBoost API en ligne!',
    version: '2.0.0',
    status: 'Actif'
  });
});

// Routes principales
app.use('/webhook', messengerRoutes);
app.use('/admin', adminRoutes);
app.use('/payment', paymentRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// ⭐⭐ UN SEUL app.listen() À LA FIN ⭐⭐
app.listen(PORT, () => {
  console.log(`🚀 CommerceBoost démarré sur le port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🏠 Accueil: http://localhost:${PORT}/`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Le port ${PORT} est déjà utilisé!`);
    console.log(`💡 Change le PORT dans ton .env ou tue le processus existant`);
  }
});