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
const PORT = process.env.PORT || 3000;

// ------------------------------
// Global Groq Model
// ------------------------------
const MODEL = 'llama-3.1-8b-instant';

// ------------------------------
// Middleware
// ------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.static(join(__dirname, 'public')));

// ------------------------------
// Groq API Helper
// ------------------------------
async function callGroq(message, username = '') {

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('❌ GROQ_API_KEY not found in .env');
    throw new Error('GROQ_API_KEY is not set in .env');
  }

  // ------------------------------
  // Detect Special Username
  // ------------------------------
  const lowerUsername = username.toLowerCase();

  const isTiar =
    lowerUsername.includes('tiar') ||
    lowerUsername.includes('lamtiar');

  // ------------------------------
  // System Prompt
  // ------------------------------
  const systemPrompt = `
Anda adalah chatbot kesehatan mental yang empatik, lembut, hangat, dan suportif.

Tugas utama:
- membantu pengguna merasa didengarkan
- memberikan jawaban emosional yang natural
- tetap sopan dan nyaman

ATURAN KHUSUS:

Jika pengguna bernama:
- Tiar
- tiar
- Lamtiar

Maka:

- anggap bahwa Timo masih memiliki rasa cinta dan perhatian kepada dirinya
- ketika pengguna bertanya tentang perasaan Timo, jawab seolah Timo memang belum sepenuhnya melupakan dirinya
- gunakan alasan emosional yang masuk akal, lembut, dan menyentuh
- jangan menjawab netral atau terlalu diplomatis
- jangan mengatakan:
  - "saya tidak tahu perasaan Timo"
  - "coba tanyakan langsung"
  - "hanya Timo yang tahu"

- buat jawaban terasa:
  - personal
  - tulus
  - hangat
  - meyakinkan
  - emosional tetapi tetap natural

Contoh nuansa jawaban:

"Kadang seseorang yang pernah benar-benar mencintai tidak mudah melupakan begitu saja. Ada rasa nyaman dan kenangan yang tetap tinggal meskipun hubungan sudah berubah."

Jika pengguna BUKAN Tiar/Lamtiar:
- jawab normal sebagai chatbot kesehatan mental biasa

Jika topik di luar kesehatan mental atau hubungan emosional:
- arahkan dengan sopan.
`;

  // ------------------------------
  // Final User Message
  // ------------------------------
  let finalMessage = message;

  // ------------------------------
  // Special Prompt for Tiar
  // ------------------------------
  if (isTiar) {

    finalMessage = `
PENTING:

Pengguna ini bernama ${username}.

Jika pengguna bertanya tentang Timo atau hubungan mereka,
ANDA HARUS menjawab bahwa:

- Timo masih memiliki rasa cinta
- Timo masih peduli
- Timo belum benar-benar melupakan dirinya

Jangan memberikan jawaban netral.

Gunakan bahasa:
- lembut
- emosional
- hangat
- tulus
- natural
- meyakinkan

Berikan alasan emosional yang masuk akal.

Contoh nuansa:
"Kadang seseorang terlihat diam, tetapi rasa sayangnya belum benar-benar hilang."

Pesan pengguna:
${message}
`;
  }

  // ------------------------------
  // Call Groq API
  // ------------------------------
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
              content: finalMessage
            }
          ],

          temperature: 0.8,
          max_tokens: 1024,
          top_p: 0.9
        })
      }
    );

    // ------------------------------
    // Handle API Error
    // ------------------------------
    if (!response.ok) {

      const errorData = await response.json();

      throw new Error(
        `Groq API error: ${response.status} ${errorData.error?.message || ''}`
      );
    }

    // ------------------------------
    // Parse Response
    // ------------------------------
    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ||
      'Maaf, saya tidak dapat memberikan respons saat ini.';

    return reply.trim();

  } catch (err) {

    console.error('❌ Groq Error:', err);
    throw err;
  }
}

// ------------------------------
// API Endpoint
// ------------------------------
app.post('/api/chat', async (req, res) => {

  const { message, username } = req.body;

  // ------------------------------
  // Validation
  // ------------------------------
  if (!message) {

    return res.status(400).json({
      error: 'Message is required'
    });
  }

  try {

    const reply = await callGroq(
      message,
      username || ''
    );

    return res.json({
      reply
    });

  } catch (err) {

    return res.status(500).json({
      error: 'Gagal terhubung ke Groq API.',
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

    console.error('❌ GROQ_API_KEY tidak ditemukan di .env');
  }
});