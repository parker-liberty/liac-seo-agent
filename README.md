# 🗽 Liberty In a Can — SEO Copywriter Agent

An AI-powered SEO copywriter built specifically for Liberty In a Can. It researches keywords, writes on-brand copy, and saves everything to Google Docs automatically.

---

## What It Does

1. **Researches** — Searches the web for keyword data, competitor content, and SEO gaps
2. **Writes** — Generates brand-voice copy: blog posts, product pages, meta tags, social captions
3. **Saves** — Pushes every output to a new Google Doc in your Drive

---

## Deploy to Vercel (5 Minutes)

### Step 1 — Get your API key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Save it — you'll need it in Step 3

### Step 2 — Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up (free)
2. Click **"Add New Project"**
3. Upload this folder (drag & drop or connect GitHub)
4. Click **Deploy** — Vercel will detect Next.js automatically

### Step 3 — Add Environment Variables in Vercel
In your Vercel project → **Settings** → **Environment Variables**, add:

| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `GOOGLE_CLIENT_EMAIL` | Your Google service account email |
| `GOOGLE_PRIVATE_KEY` | Your Google private key |
| `GOOGLE_DRIVE_FOLDER_ID` | (Optional) Your Google Drive folder ID |

Then **Redeploy** from the Vercel dashboard.

---

## Setting Up Google Docs Integration

To enable auto-saving to Google Docs:

### 1. Create a Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (name it anything, e.g. "LIAC SEO Agent")
3. Enable these APIs:
   - **Google Docs API**
   - **Google Drive API**

### 2. Create a Service Account
1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name it (e.g. "liac-seo-agent")
4. Click **Create and Continue** → **Done**
5. Click on the service account → **Keys** tab → **Add Key** → **JSON**
6. Download the JSON file

### 3. Get Your Credentials from the JSON
Open the downloaded JSON and copy:
- `client_email` → use as `GOOGLE_CLIENT_EMAIL`
- `private_key` → use as `GOOGLE_PRIVATE_KEY`

### 4. Set Up Your Google Drive Folder
1. Create a folder in Google Drive called "LIAC SEO Outputs" (or anything)
2. Right-click the folder → **Share** → share with your service account email (give Editor access)
3. Copy the folder ID from the URL: `drive.google.com/drive/folders/THIS_PART_IS_THE_ID`
4. Add as `GOOGLE_DRIVE_FOLDER_ID`

---

## Running Locally

```bash
npm install
cp .env.example .env.local
# Fill in .env.local with your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Customizing the Brand Voice

Edit `lib/brand.js` to update:
- Brand tone and voice
- SEO rules
- Output formats
- Product details

The **Style Training Notes** panel in the UI lets you add per-session style notes without editing code.

---

## Tech Stack
- **Next.js 14** — Framework
- **Anthropic Claude** — AI generation (claude-sonnet-4)
- **Web Search Tool** — Built into Claude for keyword research
- **Google Docs API** — Auto-saves outputs
- **Vercel** — Hosting (free tier works fine)
