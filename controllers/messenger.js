import axios from "axios";

export const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === process.env.VERIFY_TOKEN) {
    console.log("✅ Webhook vérifié");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

export const handleWebhookPost = async (req, res) => {
  const body = req.body;
  if (body.object === "page") {
    body.entry.forEach(async (entry) => {
      const webhookEvent = entry.messaging[0];
      console.log("📩 Event reçu :", webhookEvent);

      const senderId = webhookEvent.sender.id;
      const message = webhookEvent.message?.text;

      if (message) {
        await sendTextMessage(senderId, `Ton message : "${message}" a été reçu !`);
      }
    });
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
};

export const callSendAPI = async (senderId, messageData) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v17.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
      { recipient: { id: senderId }, message: messageData }
    );
  } catch (err) {
    console.error("❌ Erreur callSendAPI:", err.message);
  }
};

export const sendTextMessage = async (senderId, text) => {
  await callSendAPI(senderId, { text });
};
