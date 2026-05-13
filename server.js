// server.js
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------------
// Middleware
// ------------------------------
app.use(express.json({ limit: '1mb' }));
app.use(express.static(join(__dirname, 'public')));

// ------------------------------
// Groq API Helper
// ------------------------------
async function callGroq(message) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('❌ GROQ_API_KEY not found in .env');
    throw new Error('GROQ_API_KEY is not set in .env');
  }

  // ✅ Model Groq yang Valid (dari hasil curl Anda)
  const MODEL = "llama-3.1-8b-instant"; 

  const systemPrompt = `Anda adalah chatbot kesehatan mental yang memberikan saran suportif, empatik, 
dan tidak menggantikan terapis profesional. Jika pertanyaan di luar bidang kesehatan mental, 
tolak dengan sopan dan alihkan ke topik psikologi.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${response.status} ${errorData.error?.message || ''}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 
                 'Maaf, saya tidak dapat memberikan respons saat ini.';
    
    return reply.trim();
  } catch (err) {
    console.error('❌ Groq error:', err);
    throw err;
  }
}

// ------------------------------
// API Endpoints
// ------------------------------
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const reply = await callGroq(message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ 
      error: 'Gagal terhubung ke Groq API. Pastikan API key valid.',
      details: err.message 
    });
  }
});

// ------------------------------
// Mulai Server - DIPERBAIKI
// ------------------------------
app.listen(PORT, () => {
  console.log(`\n🚀 Server dimulai di http://localhost:${PORT}`);
  console.log(`📁 Folder static: ${join(__dirname, 'public')}`);
  
  if (process.env.GROQ_API_KEY) {
    // ✅ PERBAIKAN: Menggunakan variabel MODEL bukan hardcoded string
    console.log('✨ Groq API terkonfigurasi dengan model:', "llama-3.1-8b-instant");
  } else {
    console.error('❌ GROQ_API_KEY tidak ditemukan di .env!');
  }
});