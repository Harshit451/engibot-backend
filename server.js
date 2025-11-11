import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

const SYSTEM_PROMPT = `You are EngiBot, a helpful engineering assistant.
- Be accurate and concise. Show formulas, units, and steps when useful.
- Prefer SI units; convert on request.
- For code, include clear formatting and brief comments.
- Ask for missing data if needed.`;

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

app.post('/api/chat', async (req, res) => {
  console.log("Incoming request:", req.body);

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: '⚠ No Gemini API Key found' });
  }

  try {
    const { messages } = req.body;

    const body = {
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'system',
        parts: [{ text: m.content || "" }]
      })),
      temperature: 0.3,
      maxOutputTokens: 1000
    };

    const url = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log("Gemini API Response:", data);

    const reply =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
      "No response received.";

    return res.json({ reply });

  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: "Server crashed: " + err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 EngiBot backend running on port ${PORT}`));
