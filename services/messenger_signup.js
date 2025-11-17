import User from "../models/user.js";
import { sendTextMessage, sendQuickReplies, FacebookAPI } from "./fb_api_simple.js";
import { handleIARequest } from "./ia_gemini.js";

// 🔹 BANQUE TYPES COMMERCE
const TYPES_COMMERCE = [
  { title: "👕 Vêtements", payload: "TYPE_VETEMENTS" },
  { title: "🍽️ Restaurant", payload: "TYPE_RESTAURANT" },
  { title: "💄 Beauté", payload: "TYPE_BEAUTE" },
  { title: "📱 Électronique", payload: "TYPE_ELECTRONIQUE" },
  { title: "🏠 Maison", payload: "TYPE_MAISON" },
  { title: "🚗 Auto", payload: "TYPE_AUTO" }
];

// 🔹 FLOW INSCRIPTION
export async function handleNewUserMessage(senderId, text, payload) {
  const user = await User.findOne({ platform_id: senderId }) || 
                await User.create({ platform_id: senderId });

  user.lastMessageAt = new Date();

  if (!user.prenom) {
    user.prenom = text;
    await user.save();
    return await sendTypeCommerceQuickReplies(senderId);
  }

  if (!user.typeCommerce && payload && payload.startsWith("TYPE_")) {
    user.typeCommerce = payload.replace("TYPE_", "");
    await user.save();
    return await sendPhysiqueOnlineQuickReplies(senderId);
  }

  if (!user.physiqueOnline && payload && payload.startsWith("PHYSIQUE_")) {
    user.physiqueOnline = payload.replace("PHYSIQUE_", "");
    await user.save();
    return await sendAncienneteQuickReplies(senderId);
  }

  if (!user.anciennete && payload && payload.startsWith("ANCIENNETE_")) {
    user.anciennete = payload.replace("ANCIENNETE_", "");
    
    // 🚀 ACTIVATION ESSAI ELITE
    user.plan = "EliteTrial";
    user.essaiEliteStart = new Date();
    user.essaiEliteEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    user.essaiLimitLevel = 1;
    
    await user.save();
    return await sendTrialConfirmation(senderId, user.prenom);
  }

  // 🎯 USER COMPLET - ENVOYER CONSEIL QUOTIDIEN
  await sendDailyAdvice(user, senderId);
}

// 🔹 QUICK REPLIES
export function sendTypeCommerceQuickReplies(senderId) {
  return sendQuickReplies(senderId, 
    "🛍️ Quel est ton type de commerce?",
    TYPES_COMMERCE
  );
}

export function sendPhysiqueOnlineQuickReplies(senderId) {
  return sendQuickReplies(senderId,
    "📍 Comment vends-tu?",
    [
      { title: "🏪 Physique", payload: "PHYSIQUE_physique" },
      { title: "🌐 En ligne", payload: "PHYSIQUE_online" },
      { title: "🔄 Mixte", payload: "PHYSIQUE_mixte" }
    ]
  );
}

export function sendAncienneteQuickReplies(senderId) {
  return sendQuickReplies(senderId,
    "📅 Depuis combien de temps?",
    [
      { title: "🆕 Nouveau", payload: "ANCIENNETE_Nouveau" },
      { title: "📅 +1 an", payload: "ANCIENNETE_+1 an" },
      { title: "🏆 +3 ans", payload: "ANCIENNETE_+3 ans" }
    ]
  );
}

export function sendTrialConfirmation(senderId, prenom) {
  return sendQuickReplies(senderId,
    `🎉 Félicitations ${prenom}!\n\nEssai Elite 14 jours activé!\nProfite de tous nos outils.`,
    [{ title: "🚀 Démarrer", payload: "START_TRIAL" }]
  );
}

// 🔹 CONSEIL QUOTIDIEN PERSONNALISÉ
async function sendDailyAdvice(user, senderId) {
  const conseil = await generatePersonalizedAdvice(user);
  await sendTextMessage(senderId, conseil);
}

// 🔹 GÉNÉRATION CONSEIL PERSONNALISÉ
async function generatePersonalizedAdvice(user) {
  const context = `
USER: ${user.prenom} - ${user.typeCommerce} - ${user.anciennete} - ${user.physiqueOnline}
DATE: ${new Date().toLocaleDateString('fr-FR', { weekday: 'long' })}
GÉNÈRE un conseil business court et actionnable adapté à ce profil.
  `;

  return await handleIARequest(user, "conseil", context, user.platform_id);
}

// 🔹 GESTION ACTIONS IA
export async function handleIAAction(user, senderId, actionType, content) {
  return await handleIARequest(user, actionType, content, senderId);
}