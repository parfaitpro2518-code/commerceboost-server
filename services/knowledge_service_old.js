import knowledgeBase from '../data/knowledge_base.json';

class KnowledgeService {
  constructor() {
    this.conseilsUtilises = new Map(); // Pour éviter répétitions
  }

  // 🔹 CONSEIL QUOTIDEN PERSONNALISÉ
  getDailyAdvice(user) {
    const conseilsCategorie = knowledgeBase.conseils_quotidiens[user.typeCommerce?.toLowerCase()];
    if (!conseilsCategorie) return this.getGenericAdvice();

    // Filtrer par niveau d'expérience
    const conseilsFiltres = conseilsCategorie.filter(conseil => 
      this.isLevelAppropriate(conseil.niveau, user.anciennete)
    );

    // Éviter les répétitions récentes
    const conseilsNonUtilises = conseilsFiltres.filter(conseil => 
      !this.wasRecentlyUsed(user.platform_id, conseil.id)
    );

    const conseil = conseilsNonUtilises.length > 0 
      ? conseilsNonUtilises[Math.floor(Math.random() * conseilsNonUtilises.length)]
      : conseilsFiltres[Math.floor(Math.random() * conseilsFiltres.length)];

    // Marquer comme utilisé
    this.markAsUsed(user.platform_id, conseil.id);

    return this.formatAdvice(conseil, user);
  }

  // 🔹 MOTIVATION ALÉATOIRE
  getMotivation(user, contexte = 'general') {
    const motivations = knowledgeBase.motivations.filter(m => 
      m.categorie === contexte || m.categorie === 'general'
    );
    
    const motivation = motivations[Math.floor(Math.random() * motivations.length)];
    return `💫 ${motivation.contenu}\n\n- ${motivation.auteur}`;
  }

  // 🔹 HISTOIRE INSPIRANTE
  getInspirationalStory(user) {
    const stories = knowledgeBase.histoires_inspirantes;
    const story = stories[Math.floor(Math.random() * stories.length)];
    
    return `📖 HISTOIRE RÉUSSITE : ${story.titre}\n\n` +
           `👤 ${story.personnage}\n` +
           `📈 ${story.histoire}\n\n` +
           `🔑 SON SECRET : ${story.secret}\n` +
           `💡 TA LECON : ${story.lecon}\n` +
           `⏱️ DURÉE : ${story.duree}`;
  }

  // 🔹 TEMPLATE PROMOTION
  getPromoTemplate(type, user) {
    const templates = knowledgeBase.promotions_templates[type] || [];
    if (templates.length === 0) return null;

    const template = templates[Math.floor(Math.random() * templates.length)];
    return this.personalizeTemplate(template, user);
  }

  // 🔹 PERSONNALISATION TEMPLATE
  personalizeTemplate(template, user) {
    return template
      .replace('[Produit]', this.getProductSuggestion(user.typeCommerce))
      .replace('[Bénéfice]', this.getBenefitSuggestion(user.typeCommerce))
      .replace('[Saison]', this.getCurrentSeason())
      .replace('[Événement]', this.getCurrentEvent())
      .replace('[Cadeau]', this.getGiftSuggestion(user.typeCommerce))
      .replace('[Montant]', this.getAmountSuggestion(user.typeCommerce));
  }

  // 🔹 SUGGESTIONS INTELLIGENTES
  getProductSuggestion(commerceType) {
    const suggestions = {
      'vetements': 'une sélection de vêtements',
      'restaurant': 'notre menu spécial',
      'beaute': 'nos produits phares',
      'electronique': 'nos derniers modèles'
    };
    return suggestions[commerceType] || 'nos produits';
  }

  getBenefitSuggestion(commerceType) {
    const benefits = {
      'vetements': 'essayage gratuit',
      'restaurant': 'livraison offerte',
      'beaute': 'consultation gratuite',
      'electronique': 'installation incluse'
    };
    return benefits[commerceType] || 'service premium';
  }

  // 🔹 SUIVI UTILISATION
  wasRecentlyUsed(userId, conseilId) {
    const userUsed = this.conseilsUtilises.get(userId) || [];
    return userUsed.includes(conseilId);
  }

  markAsUsed(userId, conseilId) {
    const userUsed = this.conseilsUtilises.get(userId) || [];
    userUsed.push(conseilId);
    
    // Garder seulement les 10 derniers
    if (userUsed.length > 10) {
      userUsed.shift();
    }
    
    this.conseilsUtilises.set(userId, userUsed);
  }

  // 🔹 HELPERS
  isLevelAppropriate(niveauConseil, ancienneteUser) {
    const niveaux = {
      'debutant': ['Nouveau'],
      'intermediaire': ['Nouveau', '+1 an'],
      'avance': ['Nouveau', '+1 an', '+3 ans']
    };
    return niveaux[niveauConseil]?.includes(ancienneteUser) || false;
  }

  formatAdvice(conseil, user) {
    return `💡 CONSEIL DU JOUR - ${conseil.titre}\n\n` +
           `${conseil.contenu}\n\n` +
           `🎯 ACTION : ${conseil.action}\n` +
           `⏱️ TEMPS : ${conseil.duree}\n\n` +
           `Bonne chance ${user.prenom}! 💪`;
  }

  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 3 && month <= 5) return 'Saison des pluies';
    if (month >= 6 && month <= 9) return 'Saison humide';
    return 'Saison sèche';
  }

  getCurrentEvent() {
    // Logique de détection d'événements
    return 'Événement spécial';
  }
}

export default new KnowledgeService();