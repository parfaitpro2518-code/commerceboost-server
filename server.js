import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

// Controllers
import { getAIResponse, buildPrompt } from "./controllers/ai.js";
import { verifyWebhook, handleWebhookPost, sendTextMessage } from "./controllers/messenger.js";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

// ===== MongoDB connect =====
async function connectMongo() {
  const uri = process.env.MONGODB_URI || "";
  if (!uri) {
    console.warn("⚠️ MONGODB_URI vide — skip connexion MongoDB (dev only)");
    return;
  }
  try {
    await mongoose.connect(uri, {});
    console.log("✅ MongoDB connecté");
  } catch (err) {
    console.error("❌ Erreur MongoDB:", err.message || err);
  }
}
connectMongo();

// ===== Routes =====
app.get("/debug/prompt", async (req, res) => {
  const user = { businessType: "Boutique de vêtements", city: "Lomé", mainChallenge: "Peu de clients le weekend" };
  const question = req.query.q || "Comment attirer plus de clients ?";
  const prompt = buildPrompt(user, question);
  res.type("text/plain").send(prompt);
});

app.get("/webhook", verifyWebhook);
app.post("/webhook", handleWebhookPost);
app.get("/health", (req, res) => res.send("✅ Bot en ligne"));

// ===== Start server =====
app.listen(PORT, () => {
  console.log("==================================================");
  console.log("🚀 COMMERCEBOOST BOT DÉMARRÉ");
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Webhook: ${process.env.PUBLIC_URL || "https://commerceboost-server.onrender.com"}/webhook`);
  console.log(`💚 Health: ${process.env.PUBLIC_URL || "https://commerceboost-server.onrender.com"}/health`);
  console.log("==================================================");
});
