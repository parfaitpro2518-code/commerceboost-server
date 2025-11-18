import User from "../models/user.js";
import { sendTextMessage, sendQuickReplies } from "./fb_api_simple.js";
import { handleNewUserMessage } from "./messenger_signup.js";

const processedMessages = new Set();
const rateLimitMap = new Map();

// 🔹 RATE LIMITING
function checkRateLimit(userId) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId) || { count: 0, lastReset: now };
  
  if (now - userLimit.lastReset > 60000) {
    userLimit.count = 0;
    userLimit.lastReset = now;
  }
  
  userLimit.count++;
  rateLimitMap.set(userId, userLimit);
  
  return userLimit.count <= 15; // 15 messages/minute
}

// 🔹 GESTION WEBHOOK POST
export const handleWebhookPost = async (req, res) => {
  console.log("📨 Webhook Facebook reçu:", req.body);
  
  // ⭐⭐ TOUJOURS RÉPONDRE IMMÉDIATEMENT À FACEBOOK ⭐⭐
  res.status(200).send("EVENT_RECEIVED");
  
  if (req.body.object !== "page") return;

  // ⏰ OPTIMISATION RENDER
  if (process.env.NODE_ENV === 'production') {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5) {
  console.log(`⏰ Économie CPU - Bot en sommeil de 00h à 5h`);
  return;
}
  }

  for (const entry of req.body.entry) {
    const event = entry.messaging[0];
    const senderId = event.sender?.id;
    const messageId = event.message?.mid || event.postback?.mid;

    if (!senderId || !messageId || processedMessages.has(messageId)) continue;
    processedMessages.add(messageId);
    setTimeout(() => processedMessages.delete(messageId), 30 * 60 * 1000);

    try {
      // 🔒 RATE LIMITING
      if (!checkRateLimit(senderId)) {
        await sendTextMessage(senderId, "🛑 Trop de messages! Attends 1 minute.");
        continue;
      }

      // 👤 GESTION USER
      let user = await User.findOne({ platform_id: senderId });
      if (!user) {
        user = await User.create({ platform_id: senderId });
      }

      user.lastMessageAt = new Date();
      await user.save();

      // 🔄 FLOW INSCRIPTION OU TRAITEMENT
      if (!user.prenom || !user.typeCommerce || !user.anciennete) {
        await handleNewUserMessage(senderId, event.message?.text, event.postback?.payload);
        continue;
      }

      // 🎯 TRAITEMENT MESSAGE
      if (event.postback) {
        await handlePostback(user, event.postback.payload, senderId);
      } else if (event.message?.text) {
        await handleTextMessage(user, event.message.text, senderId);
      }

    } catch (error) {
      console.error("❌ Erreur:", error.message);
      try {
        await sendTextMessage(senderId, "🔧 Problème technique! Réessaie.");
      } catch (e) {}
    }
  }
};

// 🔹 GESTION POSTBACK
async function handlePostback(user, payload, senderId) {
  const { handleIAAction } = await import('./messenger_signup.js');
  
  if (payload.startsWith("TYPE_")) {
    user.typeCommerce = payload.replace("TYPE_", "");
    await user.save();
    // Continuer le flow d'inscription...
  }
  // ... autres postbacks
}

// 🔹 GESTION MESSAGE TEXTE  
async function handleTextMessage(user, text, senderId) {
  if (text.startsWith("/ia ")) {
    const { handleIAAction } = await import('./messenger_signup.js');
    await handleIAAction(user, senderId, "question", text.replace("/ia ", ""));
  } else {
    await sendTextMessage(senderId, `👋 Bonjour ${user.prenom}! Utilise "/ia ta_question" pour l'IA.`);
  }
}

// 🔹 NETTOYAGE AUTO
setInterval(() => {
  const now = Date.now();
  for (let [key, data] of rateLimitMap) {
    if (now - data.lastReset > 300000) rateLimitMap.delete(key);
  }
}, 60000);

// ⭐⭐ FONCTION DE VÉRIFICATION WEBHOOK - BIEN EXPORTÉE ⭐⭐
export const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("🔍 Facebook webhook verification:");
  console.log("Mode:", mode);
  console.log("Token reçu:", token);
  console.log("Token attendu:", process.env.FACEBOOK_VERIFY_TOKEN);

  if (mode === "subscribe" && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    console.log("✅ Webhook Facebook VÉRIFIÉ!");
    return res.status(200).send(challenge);
  }
  
  console.log("❌ Échec vérification webhook");
  return res.sendStatus(403);
};