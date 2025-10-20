import express from "express";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// 🧩 Route racine — test rapide
app.get("/", (req, res) => {
  res.send("🚀 Serveur CommerceBoost prêt !");
});

// 🔄 Route ping — pour UptimeRobot
app.get("/ping", (req, res) => {
  res.send("pong");
});

// 💤 Route shutdown — pour Cron-Job.org
let active = true;

app.get("/shutdown", (req, res) => {
  active = false;
  res.send("🛑 Serveur mis en veille !");
});

// ☀️ Route start — pour Cron-Job.org
app.get("/start", (req, res) => {
  active = true;
  res.send("✅ Serveur relancé !");
});

// 🧠 Route proxy (future connexion n8n)
app.post("/n8n", async (req, res) => {
  if (!active) return res.status(503).send("Bot en veille ⏸️");

  console.log("Données reçues :", req.body);

  // TODO: connecter à ton workflow n8n ici
  res.json({ status: "ok", message: "Données reçues avec succès" });
});

app.listen(PORT, () => console.log(`✅ Serveur en ligne sur port ${PORT}`));