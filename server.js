// ============================================
// FORJA BACKEND — server.js
// Run: node server.js
// Deploy free on: render.com or railway.app
// ============================================

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Your Anthropic API key — set this in your
//    environment variables on Render/Railway,
//    NEVER hardcode it here in production ──
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'YOUR_API_KEY_HERE';

// ── Middleware ──
app.use(cors()); // Allow requests from your frontend
app.use(express.json());
app.use(express.static('public')); // Serve frontend files from /public folder

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({ status: 'Forja backend running', version: '1.0.0' });
});

// ── Rate limiting (simple in-memory) ──
const userRequests = {};
const FREE_LIMIT = 3; // free builds per IP per day

function getRateLimit(ip) {
  const today = new Date().toDateString();
  if (!userRequests[ip] || userRequests[ip].date !== today) {
    userRequests[ip] = { date: today, count: 0 };
  }
  return userRequests[ip];
}

// ── Main AI route ──
// Your frontend calls POST /api/build
// This server calls Anthropic API with your secret key
// User never sees the key
app.post('/api/build', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { messages, projectName, isPro } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request — messages required.' });
  }

  // Rate limit free users
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

  // System prompt — this is Forja's personality and instructions
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
- Subtle gradient accents, not flat colors
- Cards with soft borders and hover lifts
- Smooth page transitions and entrance animations

OUTPUT FORMAT:
Return ONLY the raw HTML. No markdown. No explanation. No code fences.
Start directly with <!DOCTYPE html> and end with </html>.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Anthropic API error:', err);
      return res.status(500).json({ error: 'AI generation failed. Please try again.' });
    }

    const data = await response.json();
    const generatedCode = data.content?.[0]?.text || '';

    // Clean up any accidental markdown fences
    const cleaned = generatedCode
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    res.json({
      code: cleaned,
      usage: data.usage,
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
