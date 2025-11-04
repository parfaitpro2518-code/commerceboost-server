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

// Serveur dynamique
const DEFAULT_PORT = process.env.PORT || 10000;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log("==================================================");
    console.log("🚀 COMMERCEBOOST BOT DÉMARRÉ");
    console.log(`📍 Port: ${port}`);
    console.log(`🌐 Webhook: ${process.env.PUBLIC_URL || "https://commerceboost-server.onrender.com"}/webhook`);
    console.log(`💚 Health: ${process.env.PUBLIC_URL || "https://commerceboost-server.onrender.com"}/health`);
    console.log("==================================================");
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`⚠️ Le port ${port} est déjà utilisé, on essaie le suivant...`);
      startServer(port + 1);
    } else {
      console.error("❌ Erreur serveur:", err);
    }
  });
}

startServer(Number(DEFAULT_PORT));
