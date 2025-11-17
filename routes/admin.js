import express from 'express';
import adminPanel from '../services/admin_panel.js';

const router = express.Router();

// 🔹 MIDDLEWARE ADMIN
const requireAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.query.admin_key;
  
  if (!adminPanel.verifyAdmin(adminKey)) {
    return res.status(403).json({ 
      error: "Accès refusé", 
      message: "Clé admin invalide" 
    });
  }
  
  next();
};

// 📊 STATISTIQUES
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await adminPanel.getAdminStats(req.headers['x-admin-key']);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 👥 LISTE USERS
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const users = await adminPanel.getUsersList(req.headers['x-admin-key'], {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      search: search || ''
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📢 BROADCAST À TOUS
router.post('/broadcast', requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message requis" });
    }

    const result = await adminPanel.broadcastToAll(message.trim(), req.headers['x-admin-key']);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🎯 PROMO CIBLÉE
router.post('/targeted', requireAdmin, async (req, res) => {
  try {
    const { targets, message } = req.body;
    
    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ error: "Cibles requises" });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message requis" });
    }

    const result = await adminPanel.sendTargetedPromo(targets, message.trim(), req.headers['x-admin-key']);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📨 ENVOI À UN USER
router.post('/user/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: "Message requis" });
    }

    const result = await adminPanel.sendToUser(userId, message.trim(), req.headers['x-admin-key']);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;