# Forja — Launch Guide
### By Tamzid | AI Web Builder

---

## What you have

```
forja/
├── index.html      ← Landing page (your homepage)
├── app.html        ← The actual Forja app
├── server.js       ← Backend (keeps your API key safe)
├── package.json    ← Node.js config
├── render.yaml     ← Free deployment config
└── README.md       ← This file
```

---

## Step 1 — Get your free Anthropic API key

1. Go to **console.anthropic.com**
2. Sign up (free)
3. Go to "API Keys" → "Create Key"
4. Copy the key — it starts with `sk-ant-...`
5. You get **$5 free credits** — enough for ~500 website builds

---

## Step 2 — Deploy backend FREE on Render

1. Go to **render.com** → Sign up free
2. Click "New" → "Web Service"
3. Connect your GitHub account
4. Upload this project to a GitHub repo (see Step 2b)
5. Render detects `render.yaml` automatically
6. Under "Environment Variables" add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from Step 1
7. Click Deploy → You get a free URL like `https://forja-backend.onrender.com`

### Step 2b — Upload to GitHub (if you haven't)
1. Go to **github.com** → New repository → Name it `forja`
2. Upload all files
3. Done — connect to Render

---

## Step 3 — Connect your frontend to your backend

In `app.html`, find this line:
```javascript
const BACKEND_URL = 'YOUR_RENDER_URL_HERE';
```
Replace with your Render URL:
```javascript
const BACKEND_URL = 'https://forja-backend.onrender.com';
```

---

## Step 4 — Host frontend FREE on GitHub Pages

1. In your GitHub repo → Settings → Pages
2. Source: Deploy from branch → main → / (root)
3. Save → Your site is live at:
   `https://yourusername.github.io/forja/`

---

## Step 5 — Add Stripe payments (when ready)

1. Sign up at **stripe.com** (free)
2. Create a product: "Forja Pro" at $19/month
3. Get your payment link from Stripe dashboard
4. Replace the "Upgrade" buttons in the app with your Stripe link
5. No code needed for basic payments

---

## Your costs at launch

| Thing | Cost |
|---|---|
| Anthropic API | $0 (free credits) |
| Render backend | $0 (free tier) |
| GitHub Pages | $0 (always free) |
| Stripe | $0 (they take 2.9% + 30¢ per transaction) |
| **Total** | **$0 to launch** |

---

## When you start earning

| Users | Revenue | API cost | Profit |
|---|---|---|---|
| 10 users | $190/mo | ~$5/mo | ~$185/mo |
| 50 users | $950/mo | ~$25/mo | ~$925/mo |
| 100 users | $1,900/mo | ~$50/mo | ~$1,850/mo |

---

## Your launch checklist

- [ ] Sign up at console.anthropic.com → get API key
- [ ] Create GitHub account → upload files
- [ ] Sign up at render.com → deploy backend
- [ ] Add API key to Render environment variables
- [ ] Enable GitHub Pages for frontend
- [ ] Test the app end to end
- [ ] Sign up at stripe.com → create Pro plan
- [ ] Share your Forja link

---

Built by Tamzid. Powered by Claude. Owned by you.
