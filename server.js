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
// 📦 Chargement du statut persistant
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
      lastShutdown: null,
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
// 🧩 Connexion MongoDB
// ==================================================
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ MongoDB erreur:", err));

// ==================================================
// 🧠 Debug IA
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
// 🌙 GESTION DU MODE VEILLE / ACTIVITÉ DU BOT
// ==================================================

// ✅ Health
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Serveur CommerceBoost opérationnel 🚀",
    port: process.env.PORT || 10000,
  });
});

// ✅ Ping
app.get("/ping", (req, res) => {
  status.pingCount++;
  status.lastPing = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Lome" });
  saveStatus(status);
  console.log(`🟡 Ping reçu (${status.pingCount}) - ${status.lastPing}`);
  res.json({ status: "ok", botStatus: status.botStatus, ...status });
});

// ✅ Start
app.get("/start", (req, res) => {
  status.botStatus = "awake";
  status.startCount++;
  status.lastStart = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Lome" });
  saveStatus(status);
  console.log(`🟢 Bot réveillé (${status.startCount}) - ${status.lastStart}`);
  res.json({ message: "🚀 Bot réveillé", ...status });
});

// ✅ Shutdown
app.get("/shutdown", (req, res) => {
  status.botStatus = "asleep";
  status.shutdownCount++;
  status.lastShutdown = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Lome" });
  saveStatus(status);
  console.log(`🔴 Bot mis en veille (${status.shutdownCount}) - ${status.lastShutdown}`);
  res.json({ message: "😴 Bot mis en veille", ...status });
});

// ✅ Status général
app.get("/status", (req, res) => {
  res.json({
    bot: "🤖 CommerceBoost",
    status: status.botStatus === "awake" ? "✅ En ligne" : "😴 En veille",
    ...status,
    serverTime: new Date().toLocaleString("fr-FR", { timeZone: "Africa/Lome" })
  });
});

// 🔁 Auto-ping interne
setInterval(() => {
  if (status.botStatus === "awake") {
    console.log(`🔁 Auto-ping interne (${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Lome" })})`);
  }
}, 10 * 60 * 1000);

// ==================================================
// 🚀 Démarrage Serveur
// ==================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("==================================================");
  console.log("🚀 COMMERCEBOOST BOT DÉMARRÉ");
  console.log(`📍 Port: ${PORT}`);
  console.log(`💚 Health: https://commerceboost-server.onrender.com/health`);
  console.log("==================================================");
});
