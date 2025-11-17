// services/knowledge_service.js - VERSION CORRIGÉE POUR NODE v25
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Chargement manuel du JSON
let knowledgeBase = {};

try {
  const knowledgeBasePath = join(__dirname, '../data/knowledge_base.json');
  const data = readFileSync(knowledgeBasePath, 'utf8');
  knowledgeBase = JSON.parse(data);
  console.log('✅ Base de connaissances chargée avec succès');
} catch (error) {
  console.error('❌ Erreur chargement knowledge base:', error);
  // Base de connaissances par défaut en cas d'erreur
  knowledgeBase = {
    conseils_quotidiens: {
      general: [
        {
          "id": "DEFAULT_001",
          "titre": "Organisation de la boutique",
          "contenu": "Aujourd'hui, range tes produits et mets les nouveautés en vitrine pour attirer les clients."
        }
      ],
      "vetements": [
        {
          "id": "VET_DEFAULT",
          "titre": "Mise en valeur des vêtements", 
          "contenu": "Arrange tes vêtements par couleur et taille. Les clients aiment quand c'est organisé !"
        }
      ],
      "restauration": [
        {
          "id": "RES_DEFAULT",
          "titre": "Spécialité du jour",
          "contenu": "Crée un plat spécial aujourd'hui et annonce-le à l'entrée de ton restaurant."
        }
      ],
      "epicerie": [
        {
          "id": "EPI_DEFAULT", 
          "titre": "Rotation des produits",
          "contenu": "Mets les produits avec dates proches en avant pour les vendre rapidement."
        }
      ]
    },
    motivations: [
      "Chaque client satisfait est une victoire ! 🎯",
      "Le succès vient à ceux qui persévèrent 💪", 
      "Aujourd'hui est une nouvelle opportunité 🌟",
      "Tu construis ton business pas à pas, continue ! 🏗️",
      "Les petits progrès quotidiens mènent au grand succès 📈"
    ],
    idees_promotions: {
      "general": [
        "🎁 Offre spéciale : 2ème article à -25%",
        "⚡ Promo flash : -15% sur tous les produits aujourd'hui",
        "👥 Offre groupe : -10% pour 3 articles achetés"
      ],
      "vetements": [
        "👕 2ème vêtement à -30%",
        "👖 Jeans acheté = T-shirt offert", 
        "🎽 Pack 3 articles = -20% sur le total"
      ],
      "restauration": [
        "🍽️ Menu déjeuner à prix spécial",
        "🥤 Plat acheté = Boisson offerte",
        "👨‍👩‍👧‍👦 Menu famille -15%"
      ]
    }
  };
}

export class KnowledgeService {
  static getDailyAdvice(user) {
    try {
      const type = user?.typeCommerce?.toLowerCase() || 'general';
      
      // Trouve les conseils appropriés
      let conseils = knowledgeBase.conseils_quotidiens.general;
      if (type && knowledgeBase.conseils_quotidiens[type]) {
        conseils = knowledgeBase.conseils_quotidiens[type];
      }
      
      if (conseils && conseils.length > 0) {
        const randomIndex = Math.floor(Math.random() * conseils.length);
        const conseil = conseils[randomIndex];
        return `💡 ${conseil.titre}\n\n${conseil.contenu}`;
      }
      
      return "💡 Conseil du jour : Organise ta boutique et sois accueillant avec tes clients ! 😊";
      
    } catch (error) {
      console.error('❌ Erreur dans getDailyAdvice:', error);
      return "💡 Aujourd'hui, mets tes meilleurs produits en avant et souris à tes clients !";
    }
  }
  
  static getMotivation() {
    try {
      const motivations = knowledgeBase.motivations;
      if (motivations && motivations.length > 0) {
        const randomIndex = Math.floor(Math.random() * motivations.length);
        return `💪 ${motivations[randomIndex]}`;
      }
      return "💪 Tu peux le faire ! Chaque petit pas compte vers le succès.";
    } catch (error) {
      return "💪 Reste motivé ! Le succès vient avec la persévérance.";
    }
  }
  
  static getPromotionIdeas(user) {
    try {
      const type = user?.typeCommerce?.toLowerCase() || 'general';
      const idees = knowledgeBase.idees_promotions[type] || knowledgeBase.idees_promotions.general;
      
      if (idees && idees.length > 0) {
        const randomIndex = Math.floor(Math.random() * idees.length);
        return idees[randomIndex];
      }
      
      return "🎁 Idée promo : Fais une offre '2ème article -20%' cette semaine !";
      
    } catch (error) {
      return "🎁 Promotion du jour : Crée une offre spéciale pour attirer plus de clients !";
    }
  }
  
  static getWelcomeMessage(user) {
    return `👋 Bienvenue ${user?.prenom || 'cher commerçant'} ! 

Je suis CommerceBoost, ton assistant business personnel. 

Je vais t'aider à :
• 📊 Augmenter tes ventes
• 💡 Donner des conseils quotidiens  
• 🎁 Proposer des idées de promotions
• 📈 Gérer ton business mieux

Tu as 14 jours d'essai gratuit ! 🎉`;
  }
}