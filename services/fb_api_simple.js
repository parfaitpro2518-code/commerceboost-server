// services/fb_api_simple.js - VERSION COMPLÈTE CORRIGÉE
export class FacebookAPI {
  static async sendMessage(recipientId, message) {
    console.log(`📤 [SIMULATION] Message à ${recipientId}: ${message}`);
    return true;
  }
  
  static async getUserProfile(senderId) {
    return { first_name: 'Test', last_name: 'User' };
  }
}

// FONCTIONS MANQUANTES - AJOUTÉES
export async function sendTextMessage(recipientId, message) {
  console.log(`📤 [TEXT] À ${recipientId}: ${message}`);
  return await FacebookAPI.sendMessage(recipientId, message);
}

export async function sendQuickReplies(recipientId, message, quickReplies) {
  console.log(`📤 [QUICK REPLIES] À ${recipientId}: ${message}`);
  console.log(`📋 Options:`, quickReplies.map(q => q.title));
  return true;
}