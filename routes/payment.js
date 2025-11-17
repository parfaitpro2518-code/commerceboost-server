// routes/payment.js - VERSION CORRIGÉE
import express from 'express';
import { PaymentProcessor } from '../services/payment_processor.js';

const router = express.Router();

// Route pour initier un paiement
router.post('/initiate', async (req, res) => {
  try {
    const { userId, plan, amount } = req.body;
    
    const result = await PaymentProcessor.processPayment(userId, amount, plan);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur initiation paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement du paiement'
    });
  }
});

// Route pour vérifier un paiement Mobile Money
router.post('/verify-mobile-money', async (req, res) => {
  try {
    const { code } = req.body;
    
    const result = await PaymentProcessor.verifyMobileMoney(code);
    
    res.json({
      success: true,
      verified: result.verified
    });
  } catch (error) {
    console.error('❌ Erreur vérification paiement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification'
    });
  }
});

// Route de test des paiements
router.get('/test', (req, res) => {
  res.json({
    message: '✅ Route paiements fonctionnelle',
    timestamp: new Date().toISOString()
  });
});

export default router;