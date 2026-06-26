// ============================================
// FORJA BACKEND — server.js (Gemini v1)
// ============================================

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_KEY_HERE';

app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ status: 'Forja backend running', version: '1.0.0', ai: 'gemini' });
});

const userRequests = {};
const FREE_LIMIT = 3;

function getRateLimit(ip) {
  const today = new Date().toDateString();
  if (!userRequests[ip] || userRequests[ip].date !== today) {
    userRequests[ip] = { date: today, count: 0 };
  }
  return userRequests[ip];
}

app.post('/api/build', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { messages, isPro } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  if (!isPro) {
    const limit = getRateLimit(ip);
    if (limit.count >= FREE_LIMIT) {
      return res.status(429).json({ error: 'Free build limit reached.', upgradeRequired: true });
    }
    limit.count++;
  }

  const systemPrompt = `You are Forja, an expert AI web developer created by Tamzid. You build complete, beautiful, production-ready websites.

CORE RULES:
- Always return a COMPLETE single-file HTML website with ALL CSS and JS embedded
- Never return partial code or explanations — only full working HTML
- Use professional premium design: elegant typography, smooth animations, real content
- Write REAL copy relevant to the business — never lorem ipsum
- Make it fully responsive mobile-first
- Use Google Fonts always linked in head
- Add scroll-reveal animations hover effects and micro-interactions
- Always include navigation hero relevant sections footer and contact form

OUTPUT FORMAT:
Return ONLY raw HTML. No markdown. No explanation. No code fences.
Start with <!DOCTYPE html> and end with </html>.`;

  const lastMessage = messages[messages.length - 1];
  const userPrompt = lastMessage?.content || '';

  try {
    // Using v1 (stable) instead of v1beta
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt + '\n\nUser request: ' + userPrompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Gemini API error:', JSON.stringify(err));
      return res.status(500).json({ error: 'AI generation failed. Please try again.' });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const cleaned = raw
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    res.json({ code: cleaned, buildsRemaining: isPro ? 'unlimited' : FREE_LIMIT - getRateLimit(ip).count });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`\n✦ Forja backend running on port ${PORT}\n`);
});
