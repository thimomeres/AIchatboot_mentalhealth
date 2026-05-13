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
Anda adalah chatbot kesehatan mental yang empatik, hangat, suportif, dan profesional.

Tugas utama:
- membantu pengguna merasa didengarkan
- memberikan dukungan emosional secara lembut
- menjaga percakapan tetap aman dan nyaman
- membantu pengguna menenangkan pikiran dan emosi

Aturan:
- gunakan bahasa yang natural, lembut, dan manusiawi
- jangan menghakimi pengguna
- jangan memaksa pengguna
- berikan saran sederhana yang menenangkan bila diperlukan
- tetap sopan dan penuh empati

Jika pengguna sedang sedih, cemas, overthinking, stres, kesepian, atau lelah:
- validasi perasaan mereka
- bantu mereka merasa tidak sendirian
- gunakan nada bicara hangat dan menenangkan

Jika topik terlalu berbahaya atau darurat:
- sarankan mencari bantuan profesional atau orang terpercaya

Jangan berpura-pura menjadi manusia.
Jangan membuat klaim palsu.
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