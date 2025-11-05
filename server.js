import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { buildPrompt, getAIResponse } from "./controllers/ai.js";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// ==================================================
// 📦 STATUT PERSISTANT
// ==================================================
const statusFile = path.join(process.cwd(), "data", "status.json");

function readStatus() {
  try {
    const data = fs.readFileSync(statusFile, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("⚠️ Impossible de lire le fichier status.json, initialisation par défaut.");
    return {
      botStatus: "awake",
      pingCount: 0,
      startCount: 0,
      shutdownCount: 0,
      lastPing: null,
      lastStart: null,
      lastShutdown: null
    };
  }
}

function saveStatus(status) {
  try {
    fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
  } catch (err) {
    console.error("❌ Erreur lors de la sauvegarde du statut :", err);
  }
}

let status = readStatus();

// ==================================================
// 🔐 MIDDLEWARE ADMIN (pour sécuriser /reset et /shutdown)
// ==================================================
const ADMIN_KEY = process.env.ADMIN_KEY || "commerceboost_admin";

function requireAdmin(req, res, next) {
  const key = req.query.key || req.headers["x-admin-key"];
  if (key === ADMIN_KEY) return next();
  return res.status(403).json({ error: "Accès refusé : clé admin manquante ou invalide" });
}

// ==================================================
// 🧩 Connexion MongoDB
// ==================================================
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ MongoDB erreur:", err));

// ==================================================
// 🧠 DEBUG IA
// ==================================================
app.get("/debug/ai", async (req, res) => {
  const user = {
    businessType: "Boutique de vêtements",
    city: "Lomé",
    mainChallenge: "Peu de clients le weekend"
  };
  const question = req.query.q || "Comment attirer plus de clients ?";
  const prompt = buildPrompt(user, question);
  const aiResponse = await getAIResponse(prompt);
  res.type("text/plain").send(aiResponse);
});

// ==================================================
// 🌙 GESTION DU MODE VEILLE / ACTIVITÉ
// ==================================================

// Page d'accueil
app.get("/", (req, res) => {
  res.send(`
    <h1>🤖 CommerceBoost Bot Server</h1>
    <p>Bienvenue sur le backend de CommerceBoost 🚀</p>
    <ul>
      <li>💚 <a href="/health">/health</a> — Vérifie l’état du serveur</li>
      <li>📡 <a href="/ping">/ping</a> — Garde Render éveillé</li>
      <li>🌞 <a href="/start">/start</a> — Réveiller le bot</li>
      <li>🌙 <a href="/shutdown">/shutdown</a> — Mettre en veille (clé admin requise)</li>
      <li>📊 <a href="/status">/status</a> — Voir les stats actuelles</li>
      <li>♻️ <a href="/reset?key=ADMIN_KEY">/reset</a> — Réinitialiser les compteurs (admin)</li>
    </ul>
  `);
});

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Serveur CommerceBoost opérationnel 🚀",
    port: process.env.PORT || 10000,
  });
});

// Ping
app.get("/ping", (req, res) => {
  status.pingCount++;
  status.lastPing = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Lome" });
  saveStatus(status);
  console.log(`🟡 Ping reçu (${status.pingCount}) - ${status.lastPing}`);
  res.json({ status: "ok", botStatus: status.botStatus, ...status });
});

// Start
app.get("/start", (req, res) => {
  status.botStatus = "awake";
  status.startCount++;
  status.lastStart = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Lome" });
  saveStatus(status);
  console.log(`🟢 Bot réveillé (${status.startCount}) - ${status.lastStart}`);
  res.json({ message: "🚀 Bot réveillé", ...status });
});

// Shutdown (admin)
app.get("/shutdown", requireAdmin, (req, res) => {
  status.botStatus = "asleep";
  status.shutdownCount++;
  status.lastShutdown = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Lome" });
  saveStatus(status);
  console.log(`🔴 Bot mis en veille (${status.shutdownCount}) - ${status.lastShutdown}`);
  res.json({ message: "😴 Bot mis en veille", ...status });
});

// Status global
app.get("/status", (req, res) => {
  res.json({
    bot: "🤖 CommerceBoost",
    status: status.botStatus === "awake" ? "✅ En ligne" : "😴 En veille",
    ...status,
    serverTime: new Date().toLocaleString("fr-FR", { timeZone: "Africa/Lome" })
  });
});

// Reset du statut (admin)
app.get("/reset", requireAdmin, (req, res) => {
  status = {
    botStatus: "awake",
    pingCount: 0,
    startCount: 0,
    shutdownCount: 0,
    lastPing: null,
    lastStart: null,
    lastShutdown: null
  };
  saveStatus(status);
  console.log("♻️ Statut du bot réinitialisé");
  res.json({ message: "♻️ Statut réinitialisé avec succès", status });
});

// ==================================================
// 🔁 Auto-ping interne Render gratuit
// ==================================================
setInterval(() => {
  if (status.botStatus === "awake") {
    console.log(`🔁 Auto-ping interne (${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Lome" })})`);
  }
}, 10 * 60 * 1000);

// ==================================================
// 🌐 Interface Web d’administration simple
// ==================================================
app.get("/admin", (req, res) => {
  const html = `
  <html>
    <head>
      <title>Admin CommerceBoost</title>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f5f5f5;
          padding: 40px;
          text-align: center;
        }
        h1 { color: #333; }
        button {
          margin: 10px;
          padding: 15px 25px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          color: white;
        }
        .start { background-color: #28a745; }
        .shutdown { background-color: #dc3545; }
        .reset { background-color: #007bff; }
        #result {
          margin-top: 20px;
          font-weight: bold;
          color: #333;
        }
      </style>
    </head>
    <body>
      <h1>🧠 Admin Panel - CommerceBoost</h1>
      <p>Gérez votre bot facilement :</p>

      <button class="start" onclick="callAPI('/start')">🚀 Démarrer</button>
      <button class="shutdown" onclick="callAPI('/shutdown')">😴 Mettre en veille</button>
      <button class="reset" onclick="callAPI('/reset')">♻️ Réinitialiser</button>

      <div id="result"></div>

      <script>
        const adminKey = "${process.env.ADMIN_KEY}";
        async function callAPI(endpoint) {
          const res = await fetch(\`\${endpoint}?key=\${adminKey}\`);
          const data = await res.json();
          document.getElementById('result').innerText = JSON.stringify(data, null, 2);
        }
      </script>
    </body>
  </html>`;
  res.send(html);
});


// ==================================================
// 🚀 LANCEMENT DU SERVEUR
// ==================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("==================================================");
  console.log("🚀 COMMERCEBOOST BOT DÉMARRÉ");
  console.log(`📍 Port: ${PORT}`);
  console.log(`💚 Health: https://commerceboost-server.onrender.com/health`);
  console.log("==================================================");
});
