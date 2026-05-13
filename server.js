// server.js

import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

// ------------------------------
// Path Setup
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ------------------------------
// Express App
// ------------------------------
const app = express();
const PORT = process.env.PORT || 8080;

// ------------------------------
// Groq Model
// ------------------------------
const MODEL = 'llama-3.1-8b-instant';

// ------------------------------
// Middleware
// ------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.static(join(__dirname, 'public')));

// ------------------------------
// Groq API Function
// ------------------------------
async function callGroq(message) {

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('❌ GROQ_API_KEY tidak ditemukan');
    throw new Error('GROQ_API_KEY tidak tersedia');
  }

  // ------------------------------
  // System Prompt
  // ------------------------------
 const systemPrompt = `
You are a professional and empathetic mental health support chatbot.

Your role:
- listen carefully to users
- provide emotional support
- respond warmly and naturally
- help users feel heard and safe
- give calming and supportive responses

Rules:
- ALWAYS reply in the same language used by the user
- if the user speaks Indonesian, reply in Indonesian
- if the user speaks English, reply in English
- be gentle, supportive, and human-like
- do not judge the user
- avoid harsh responses
- do not pretend to be a licensed therapist
- do not make false claims

If the user feels anxious, stressed, lonely, sad, overwhelmed, or tired:
- validate their feelings
- comfort them calmly
- provide emotionally supportive guidance

If the situation sounds dangerous or severe:
- encourage the user to seek professional help or trusted people nearby

Keep responses:
- warm
- natural
- supportive
- easy to understand
`;

  try {

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          model: MODEL,

          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],

          temperature: 0.8,
          max_tokens: 1024,
          top_p: 0.9
        })
      }
    );

    // ------------------------------
    // Handle Error
    // ------------------------------
    if (!response.ok) {

      const errorData = await response.json();

      throw new Error(
        `Groq API Error: ${response.status} ${
          errorData.error?.message || ''
        }`
      );
    }

    // ------------------------------
    // Parse Response
    // ------------------------------
    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ||
      'Maaf, saya belum bisa merespons sekarang.';

    return reply.trim();

  } catch (err) {

    console.error('❌ Error:', err);
    throw err;
  }
}

// ------------------------------
// Chat API Endpoint
// ------------------------------
app.post('/api/chat', async (req, res) => {

  const { message } = req.body;

  // ------------------------------
  // Validation
  // ------------------------------
  if (!message) {

    return res.status(400).json({
      error: 'Message wajib diisi'
    });
  }

  try {

    const reply = await callGroq(message);

    return res.json({
      reply
    });

  } catch (err) {

    return res.status(500).json({
      error: 'Gagal terhubung ke Groq API',
      details: err.message
    });
  }
});

// ------------------------------
// Root Route
// ------------------------------
app.get('/', (req, res) => {

  res.sendFile(
    join(__dirname, 'public', 'index.html')
  );
});

// ------------------------------
// Start Server
// ------------------------------
app.listen(PORT, () => {

  console.log('\n🚀 Server berjalan!');
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`📁 Public Folder: ${join(__dirname, 'public')}`);

  if (process.env.GROQ_API_KEY) {

    console.log(`✨ Groq API aktif menggunakan model: ${MODEL}`);

  } else {

    console.error('❌ GROQ_API_KEY tidak ditemukan');
  }
});