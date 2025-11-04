import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { buildPrompt, getAIResponse } from "./controllers/ai.js";
dotenv.config();

const app = express();
app.use(bodyParser.json());

// MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ MongoDB erreur:", err));

// Debug route IA
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

// Health check
app.get("/health", (req, res) => res.send("✅ Server alive"));

// ==================================================
// 🌙 GESTION DU MODE VEILLE / ACTIVITÉ DU BOT
// ==================================================
let botStatus = "awake";
let pingCount = 0;
let startCount = 0;
let shutdownCount = 0;

// ✅ Route Health Check (Render utilise ça pour vérifier que le serveur est vivant)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Serveur CommerceBoost opérationnel 🚀",
    port: process.env.PORT || DEFAULT_PORT,
  });
});

// ✅ Route Ping (utilisée par cron-job.org)
app.get("/ping", (req, res) => {
  pingCount++;
  console.log(`🟡 Ping reçu (${pingCount}) - ${new Date().toISOString()}`);
  res.json({
    status: "ok",
    pingCount,
    botStatus,
    timestamp: new Date().toISOString(),
  });
});

// ✅ Route Start (réveiller le bot manuellement)
app.get("/start", (req, res) => {
  botStatus = "awake";
  startCount++;
  console.log(`🟢 Bot réveillé (${startCount})`);
  res.json({
    status: "awake",
    message: "Le bot CommerceBoost est en ligne 🚀",
    startCount,
    timestamp: new Date().toISOString(),
  });
});

// ✅ Route Shutdown (mettre le bot en veille manuellement)
app.get("/shutdown", (req, res) => {
  botStatus = "asleep";
  shutdownCount++;
  console.log(`🔴 Bot mis en veille (${shutdownCount})`);
  res.json({
    status: "asleep",
    message: "Le bot CommerceBoost est en veille 😴",
    shutdownCount,
    timestamp: new Date().toISOString(),
  });
});

// ==================================================
// 🔁 Rappel auto (ping toutes les 10 min pour Render gratuit)
// ==================================================
setInterval(() => {
  if (botStatus === "awake") {
    console.log(`🔁 Auto-ping interne pour garder Render éveillé`);
  }
}, 10 * 60 * 1000); // toutes les 10 minutes

// Serveur dynamique
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("==================================================");
  console.log("🚀 COMMERCEBOOST BOT DÉMARRÉ");
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Webhook: https://commerceboost-server.onrender.com/webhook`);
  console.log(`💚 Health: https://commerceboost-server.onrender.com/health`);
  console.log("==================================================");
});
