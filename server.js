// ============================================
// FORJA BACKEND — server.js (Gemini version)
// ============================================

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_KEY_HERE';

// ── Middleware ──
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

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({ status: 'Forja backend running', version: '1.0.0', ai: 'gemini' });
});

// ── Rate limiting ──
const userRequests = {};
const FREE_LIMIT = 3;

function getRateLimit(ip) {
  const today = new Date().toDateString();
  if (!userRequests[ip] || userRequests[ip].date !== today) {
    userRequests[ip] = { date: today, count: 0 };
  }
  return userRequests[ip];
}

// ── Main AI route ──
app.post('/api/build', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { messages, isPro } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request — messages required.' });
  }

  if (!isPro) {
    const limit = getRateLimit(ip);
    if (limit.count >= FREE_LIMIT) {
      return res.status(429).json({
        error: 'Free build limit reached (3/day). Upgrade to Pro for unlimited builds.',
        upgradeRequired: true
      });
    }
    limit.count++;
  }

  const systemPrompt = `You are Forja, an expert AI web developer created by Tamzid. You build complete, beautiful, production-ready websites.

CORE RULES:
- Always return a COMPLETE single-file HTML website with ALL CSS and JS embedded
- Never return partial code, snippets, or explanations — only full working HTML
- Use professional, premium design: elegant typography, smooth animations, real content
- Write REAL copy relevant to the business — never lorem ipsum
- Make it fully responsive (mobile-first)
- Use Google Fonts (always link them in <head>)
- Add scroll-reveal animations, hover effects, and micro-interactions
- Use CSS custom properties for easy theming
- Always include: navigation, hero, relevant sections, footer, working contact form

DESIGN PHILOSOPHY:
- Dark, rich backgrounds with warm accent colors feel premium
- Pair a serif display font with a clean sans-serif body font
- Full-bleed hero sections with overlay text
- Cards with soft borders and hover lifts
- Smooth entrance animations

OUTPUT FORMAT:
Return ONLY the raw HTML. No markdown. No explanation. No code fences.
Start directly with <!DOCTYPE html> and end with </html>.`;

  // Build prompt from conversation history
  const lastMessage = messages[messages.length - 1];
  const userPrompt = lastMessage?.content || '';

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            { role: 'user', parts: [{ text: userPrompt }] }
          ],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7
          }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('Gemini API error:', err);
      return res.status(500).json({ error: 'AI generation failed. Please try again.' });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean up any accidental markdown fences
    const cleaned = raw
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    res.json({
      code: cleaned,
      buildsRemaining: isPro ? 'unlimited' : FREE_LIMIT - getRateLimit(ip).count
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── Start server ──
app.listen(PORT, () => {
  console.log(`\n✦ Forja backend running on port ${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
  console.log(`  API endpoint: http://localhost:${PORT}/api/build\n`);
});
