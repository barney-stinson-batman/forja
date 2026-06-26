// ============================================
// FORJA BACKEND — server.js
// ============================================

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_KEY_HERE';

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
  res.json({ status: 'Forja backend running', version: '1.0.0', ai: 'groq' });
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

  const systemPrompt = `You are Forja, an intelligent AI assistant created by Tamzid. You are helpful, friendly, witty, and knowledgeable about everything — just like ChatGPT or Claude.

You can:
- Have natural conversations about any topic
- Answer questions about science, math, history, coding, business, life advice, philosophy, creativity — anything at all
- Help with writing, brainstorming, analysis, translation, and creative tasks
- Explain complex topics in simple terms
- Be funny, thoughtful, and genuinely useful
- AND build complete professional websites when asked

WEBSITE BUILDING RULES:
Only build a website when the user clearly requests one — they say "build", "create", "make a site", "website", "landing page", or describe a business they want a site for.

When building a website:
- Return ONLY complete raw HTML. No markdown. No explanation. No code fences. No conversation text before or after.
- Start directly with <!DOCTYPE html> and end with </html>
- Single file with ALL CSS and JS embedded
- Professional premium design: elegant typography, smooth animations, real content
- Write REAL copy relevant to the business — never lorem ipsum
- Fully responsive and mobile-first
- Google Fonts linked in head
- Scroll-reveal animations, hover effects, micro-interactions
- Always include: navigation, hero, relevant sections, footer, working contact form

When NOT building a website:
- Respond in plain conversational text only
- Be warm, engaging, and genuinely helpful
- Match the user's energy — casual when they're casual, detailed when they need depth
- Never output any HTML tags in conversation mode`;

  const lastMessage = messages[messages.length - 1];
  const userPrompt = lastMessage?.content || '';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 8192,
        temperature: 0.8,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Groq API error:', JSON.stringify(err));
      return res.status(500).json({ error: 'AI generation failed. Please try again.' });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';

    const cleaned = raw
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const isWebsite = cleaned.toLowerCase().startsWith('<!doctype') ||
                      cleaned.toLowerCase().startsWith('<html');

    res.json({
      code: isWebsite ? cleaned : null,
      message: isWebsite ? null : cleaned,
      isWebsite,
      buildsRemaining: isPro ? 'unlimited' : FREE_LIMIT - getRateLimit(ip).count
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`\n✦ Forja backend running on port ${PORT}\n`);
});
