import fetch from 'node-fetch';

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const API_URL = 'https://graph.facebook.com/v19.0';

class FacebookAPI {
  constructor() {
    this.token = PAGE_ACCESS_TOKEN;
  }

  // 🔹 ENVOI MESSAGE TEXTE SIMPLE
  async sendTextMessage(recipientId, text) {
    try {
      const response = await fetch(`${API_URL}/me/messages?access_token=${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: text },
          messaging_type: 'RESPONSE'
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error('❌ Erreur Facebook API:', data.error);
        throw new Error(`Facebook API: ${data.error.message}`);
      }

      console.log(`✅ Message envoyé à ${recipientId}`);
      return data;

    } catch (error) {
      console.error('❌ Erreur envoi message:', error.message);
      throw error;
    }
  }

  // 🔹 ENVOI QUICK REPLIES
  async sendQuickReplies(recipientId, text, quickReplies) {
    try {
      const response = await fetch(`${API_URL}/me/messages?access_token=${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: {
            text: text,
            quick_replies: quickReplies.map(reply => ({
              content_type: 'text',
              title: reply.title,
              payload: reply.payload,
              image_url: reply.image_url // Optionnel
            }))
          },
          messaging_type: 'RESPONSE'
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error('❌ Erreur Quick Replies:', data.error);
        throw new Error(`Facebook API: ${data.error.message}`);
      }

      console.log(`✅ Quick replies envoyés à ${recipientId}`);
      return data;

    } catch (error) {
      console.error('❌ Erreur envoi quick replies:', error.message);
      throw error;
    }
  }

  // 🔹 ENVOI BOUTONS
  async sendButtons(recipientId, text, buttons) {
    try {
      const response = await fetch(`${API_URL}/me/messages?access_token=${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'button',
                text: text,
                buttons: buttons.map(button => ({
                  type: button.type || 'postback',
                  title: button.title,
                  payload: button.payload,
                  url: button.url // Pour type 'web_url'
                }))
              }
            }
          },
          messaging_type: 'RESPONSE'
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error('❌ Erreur Buttons:', data.error);
        throw new Error(`Facebook API: ${data.error.message}`);
      }

      console.log(`✅ Buttons envoyés à ${recipientId}`);
      return data;

    } catch (error) {
      console.error('❌ Erreur envoi buttons:', error.message);
      throw error;
    }
  }

  // 🔹 ENVOI MESSAGE GÉNÉRIQUE (CAROUSEL)
  async sendGenericTemplate(recipientId, elements) {
    try {
      const response = await fetch(`${API_URL}/me/messages?access_token=${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'generic',
                elements: elements.map(element => ({
                  title: element.title,
                  subtitle: element.subtitle,
                  image_url: element.image_url,
                  buttons: element.buttons || []
                }))
              }
            }
          },
          messaging_type: 'RESPONSE'
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error('❌ Erreur Generic Template:', data.error);
        throw new Error(`Facebook API: ${data.error.message}`);
      }

      console.log(`✅ Generic template envoyé à ${recipientId}`);
      return data;

    } catch (error) {
      console.error('❌ Erreur envoi generic template:', error.message);
      throw error;
    }
  }

  // 🔹 RÉCUPÉRATION INFOS USER
  async getUserProfile(userId) {
    try {
      const response = await fetch(
        `${API_URL}/${userId}?fields=first_name,last_name,profile_pic,locale,timezone&access_token=${this.token}`
      );

      const data = await response.json();

      if (data.error) {
        console.error('❌ Erreur récupération profil:', data.error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('❌ Erreur getUserProfile:', error.message);
      return null;
    }
  }

  // 🔹 ENVOI MESSAGE AVEC MARKER TYPING
  async sendTypingOn(recipientId) {
    try {
      await fetch(`${API_URL}/me/messages?access_token=${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: 'typing_on'
        })
      });
    } catch (error) {
      console.error('❌ Erreur typing on:', error.message);
    }
  }

  async sendTypingOff(recipientId) {
    try {
      await fetch(`${API_URL}/me/messages?access_token=${this.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          sender_action: 'typing_off'
        })
      });
    } catch (error) {
      console.error('❌ Erreur typing off:', error.message);
    }
  }

  // 🔹 ENVOI MESSAGE AVEC EFFET TYPING
  async sendMessageWithTyping(recipientId, text, typingDelay = 1000) {
    try {
      // Démarre l'indicateur de frappe
      await this.sendTypingOn(recipientId);
      
      // Simule le délai de frappe
      await new Promise(resolve => setTimeout(resolve, typingDelay));
      
      // Arrête l'indicateur et envoie le message
      await this.sendTypingOff(recipientId);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return await this.sendTextMessage(recipientId, text);
      
    } catch (error) {
      console.error('❌ Erreur sendMessageWithTyping:', error.message);
      throw error;
    }
  }

  // 🔹 VÉRIFICATION STATUT PAGE
  async getPageInfo() {
    try {
      const response = await fetch(
        `${API_URL}/me?fields=name,id,about,fan_count&access_token=${this.token}`
      );

      const data = await response.json();

      if (data.error) {
        console.error('❌ Erreur page info:', data.error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('❌ Erreur getPageInfo:', error.message);
      return null;
    }
  }

  // 🔹 GESTION ERREURS FACEBOOK
  handleFacebookError(error) {
    const errorCode = error.code;
    
    switch (errorCode) {
      case 10:
        return "❌ Permission non accordée pour l'API";
      case 100:
        return "❌ Paramètre invalide";
      case 190:
        return "❌ Token d'accès expiré ou invalide";
      case 613:
        return "❌ Limite d'appels API dépassée";
      default:
        return `❌ Erreur Facebook: ${error.message}`;
    }
  }
}

// Instance globale
const facebookAPI = new FacebookAPI();

// Export des fonctions principales
export const sendTextMessage = (recipientId, text) => 
  facebookAPI.sendTextMessage(recipientId, text);

export const sendQuickReplies = (recipientId, text, quickReplies) => 
  facebookAPI.sendQuickReplies(recipientId, text, quickReplies);

export const sendButtons = (recipientId, text, buttons) => 
  facebookAPI.sendButtons(recipientId, text, buttons);

export const sendGenericTemplate = (recipientId, elements) => 
  facebookAPI.sendGenericTemplate(recipientId, elements);

export const sendMessageWithTyping = (recipientId, text, typingDelay) => 
  facebookAPI.sendMessageWithTyping(recipientId, text, typingDelay);

export const getUserProfile = (userId) => 
  facebookAPI.getUserProfile(userId);

export const getPageInfo = () => 
  facebookAPI.getPageInfo();

export default facebookAPI;