import express from 'express';
import { verifyWebhook, handleWebhookPost } from '../services/messenger.js';

const router = express.Router();

// 🔹 WEBHOOK VERIFICATION (Facebook)
router.get('/', verifyWebhook);

// 🔹 WEBHOOK MESSAGES (Facebook)
router.post('/', handleWebhookPost);

export default router;