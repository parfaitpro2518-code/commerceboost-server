// services/ia_gemini.js - IMPORT CORRIGÉ
import { sendTextMessage } from "./fb_api_simple.js"; // CORRIGÉ : fb_api_simple.js au lieu de fb_api.js
import { KnowledgeService } from "./knowledge_service.js";

// 🔹 FILTRE QUESTIONS HORS SUJET
function isOffTopicQuestion(content) {
  const offTopicKeywords = [
    // Santé
    'médecin', 'malade', 'médicament', 'hôpital', 'santé', 'docteur', 'maladie',
    // Politique
    'président', 'gouvernement', 'politique', 'élection', 'parti', 'ministre',
    // Technique
    'code', 'programmation', 'instagram', 'tiktok', 'youtube', 'facebook',
    // Personnel
    'amour', 'mariage', 'famille', 'divorce', 'relation', 'couple',
    // Autre
    'blague', 'histoire', 'cinéma', 'musique', 'sport', 'football', 'film'
  ];

  const question = content.toLowerCase();
  return offTopicKeywords.some(keyword => question.includes(keyword));
}

// 🔹 PROMPT EXPERT AVEC CONTRAINTES STRICTES
function generateExpertPrompt(user, type, content) {
  return `
TU ES: Expert business senior spécialisé Marché Togo - Assistant CommerceBoost
MISSION: Aider les commerçants togolais à développer leur business
SPECIALITE: ${user.typeCommerce} - ${user.ville || 'Togo'}

🚫 RÈGLES ABSOLUES - NE JAMAIS:
1. Répondre à des questions hors business/commerce
2. Donner des conseils médicaux, juridiques, financiers
3. Mentionner des noms d'entreprises, marques, personnes
4. Donner des prix spécifiques en FCFA
5. Inventer des statistiques ou études
6. Faire des promesses de résultats garantis
7. Mentionner les prix, lieux, personnes à contacter et chiffres fictifs

✅ OBLIGATOIRE:
1. Conseils pratiques et testables immédiatement
2. Adapté au marché togolais réel
3. Respect du niveau d'expérience: ${user.anciennete}
4. Maximum 400 mots - Clair et concis
5. Focus solutions, pas problèmes
6. Pour ne pas mentionner les prix, lieux, personnes et chiffre fais un truc du genre "va dans le marché le plus proche et demande les plastiques aluminium, entre 1500f à 2000f"

CONTEXTE UTILISATEUR:
- Prénom: ${user.prenom}
- Commerce: ${user.typeCommerce} (${user.physiqueOnline})
- Expérience: ${user.anciennete}
- Localisation: ${user.ville || 'Non spécifié'}
- Plan: ${user.plan}
- Historique récent: ${user.iaHistory?.slice(-2).map(h => h.type).join(', ') || 'Nouveau'}

CONNAISSANCE MARCHÉ TOGO:
• Économie informelle importante
• Mobile money dominant (Flooz, T-Money)
• Importance relations clients
• Saisonnalité: ${new Date().getMonth() >= 6 ? 'Saison des pluies' : 'Saison sèche'}
• Canaux efficaces: WhatsApp, Facebook, bouche-à-oreille

QUESTION/SUJET: ${content}

SI la question est HORS SUJET (santé, politique, personnel, technique):
→ Répondre poliment que tu es spécialisé business

SINON:
→ Donner 1 conseil ACTIONNABLE aujourd'hui + 1 stratégie moyen terme
→ Basé sur le profil exact de ${user.prenom}
→ Adapté à son niveau ${user.anciennete}
→ Maximum 3 étapes claires
→ Terminer par une question pour engagement
  `;
}

// 🔹 GESTION IA PRINCIPALE
export async function handleIARequest(user, type, content, senderId) {
  try {
    // 🚨 FILTRAGE HORS SUJET
    if (isOffTopicQuestion(content)) {
      return `🤖 Désolé ${user.prenom}, je suis spécialisé dans le conseil business pour les commerçants togolais.\n\nJe peux t'aider avec:\n• Stratégies de vente et marketing\n• Gestion de stock et inventaire\n• Techniques de fidélisation clients\n• Création de promotions efficaces\n• Analyse de ton business\n\nQuel défi business veux-tu aborder aujourd'hui? 💪`;
    }

    // 🔒 VALIDATION
    if (!content || content.length > 500) {
      return "❌ Question trop longue! Maximum 500 caractères pour une réponse précise.";
    }

    // 🧠 GÉNÉRATION RÉPONSE (SIMULATION)
    const baseResponses = {
      conseil: `💡 CONSEIL EXPERT POUR ${user.prenom?.toUpperCase() || 'TON COMMERCE'}

Basé sur ton profil ${user.typeCommerce} (${user.anciennete}), voici une stratégie adaptée:

🎯 ACTION IMMÉDIATE (Aujourd'hui):
Range ta boutique et mets tes meilleurs produits en avant.

📈 STRATÉGIE MOYEN TERME (Cette semaine):
Crée une promotion simple pour attirer plus de clients.

🚀 VISION LONG TERME:
Continue d'apprendre et d'améliorer ton business pas à pas.

💪 Adapté à ton commerce ${user.physiqueOnline} et ton expérience ${user.anciennete}.`,

      question: `🤖 ANALYSE EXPERTE - ${user.typeCommerce?.toUpperCase()}

POUR TA QUESTION, JE RECOMMANDE:

1️⃣ SOLUTION COURT TERME
Une action rapide pour des résultats visibles.

2️⃣ STRATÉGIE MOYEN TERME  
Un plan structuré pour la semaine.

3️⃣ ORIENTATION LONG TERME
Perspective adaptée à ton niveau ${user.anciennete}.

📞 Reviens me dire comment se passe la mise en œuvre!`
    };

    return baseResponses[type] || baseResponses.question;

  } catch (error) {
    console.error("❌ Erreur IA:", error);
    return "🤖 Désolé, problème technique avec l'IA! Réessaie dans 1 minute.\n\nEn attendant: " + KnowledgeService.getDailyAdvice(user);
  }
}