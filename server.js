import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

// SYSTEM PROMPT
const SYSTEM_PROMPT = `
You are EngiBot, a helpful engineering assistant.
- Be accurate and concise.
- Show steps, formulas, units when useful.
- Prefer SI units.
- For code, use formatting and comments.
- Ask for missing inputs if needed.
`;

const app = express();
app.use(express.json());

// ROOT CHECK
app.get("/", (req, res) => {
  res.send("EngiBot backend is running");
});

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ENV
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash";

// MAIN CHAT ROUTE
app.post("/api/chat", async (req, res) => {
  let { messages, message } = req.body;

  // Support single-message input from frontend
  if (!messages && message) {
    messages = [{ role: "user", content: message }];
  }

  // Validation
  if (!messages) {
    return res.status(400).json({ error: "No messages provided" });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "No Gemini API Key found." });
  }

  try {
    // Gemini request body
    const body = {
      contents: [
        {
          role: "system",
          parts: [{ text: SYSTEM_PROMPT }]
        },
        ...messages.map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }]
        }))
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 500
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log("Gemini Response:", data);

    if (data.error) {
      console.error("Gemini ERROR:", data.error);
      return res.status(500).json({ reply: "Error: " + data.error.message });
    }

    // Extract text safely
    const text =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      "No response received from Gemini.";

    res.json({ reply: text });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ reply: "Server Crashed: " + err.message });
  }
});

// START SERVER
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`🚀 EngiBot backend running on port ${PORT}`)
);
