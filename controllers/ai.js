export const buildPrompt = (user, question) => {
  return `
Tu es un expert en marketing pour petites entreprises africaines.

CONTEXTE UTILISATEUR :
- Type business : ${user.businessType}
- Localisation : ${user.city} (généralise, pas de quartiers spécifiques)
- Défi principal : ${user.mainChallenge}

QUESTION :
${question}

GÉNÈRE un conseil marketing qui :
1. Utilise principes universels
2. Donne stratégie applicable partout
3. Inclut étapes concrètes
4. Si exemple : "Un commerçant" (jamais nom fictif)
5. Si prix : variables X, Y ou fourchettes
6. Reste factuel

INTERDICTIONS STRICTES :
❌ Noms fictifs
❌ Prix exact fictifs
❌ Adresses précises
❌ Statistiques inventées

Format : 250-300 mots
Ton : Conversationnel, actionnable, honnête
Langue : Français (Afrique de l'Ouest)

CONSEIL :
`;
};

export const getAIResponse = async (prompt) => {
  // Placeholder : tu intégreras Gemini ici
  return `Réponse AI simulée pour le prompt : ${prompt.substring(0, 50)}...`;
};
