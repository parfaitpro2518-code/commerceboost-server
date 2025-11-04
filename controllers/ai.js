import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const CONSEILS_RESERVE_PATH = path.join(process.cwd(), "data", "conseils_reserve.json");

// Construire le prompt
export function buildPrompt(user, question) {
  return `
Tu es un expert en marketing pour petites entreprises africaines.

CONTEXTE UTILISATEUR :
- Type business : ${user.businessType}
- Localisation : ${user.city}
- Défi principal : ${user.mainChallenge}

GÉNÈRE un conseil marketing qui :
1. Utilise principes universels
2. Donne stratégie applicable partout
3. Inclut étapes concrètes
4. Si tu donnes un exemple, dis "Un commerçant"
5. Si tu parles prix, utilise variables ou fourchettes
6. Reste factuel

Format : 250-300 mots maximum
Ton : Conversationnel, actionnable, honnête
Langue : Français (Afrique de l'Ouest)

Question : ${question}

CONSEIL :
`;
}

// Appel Gemini avec fallback
export async function getAIResponse(prompt) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY } }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Vide");
    return text;
  } catch (error) {
    console.warn("⚠️ Gemini indisponible, utilisation des conseils en réserve.");
    const data = fs.readFileSync(CONSEILS_RESERVE_PATH, "utf8");
    const conseils = JSON.parse(data);
    const conseil = conseils[Math.floor(Math.random() * conseils.length)];
    return `💡 CONSEIL RESERVE
Titre: ${conseil.titre}
Solution: ${conseil.solution}
Action concrète: ${conseil.action_concrete}
Résultat attendu: ${conseil.resultat_attendu}
Exemple local: ${conseil.exemple_local}`;
  }
}
