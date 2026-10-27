# Cold Start 🚀
> **Cold emails that prove you did your homework.**  
> Built for **No Hands: The Wispr Challenge** (WeMakeDevs × Wispr Flow).

---

## 💡 The Problem
Job-hunting by cold outreach is brutal:
- Generic outreach (*"Hi, I love your product and am passionate about..."*) gets an 8% or worse reply rate.
- Truly personalized emails that cite recent changelogs, specific edge cases, and relevant portfolio projects take **30 to 45 minutes** each.
- Job seekers either send spammy templates that burn bridges or burn out after writing 4 emails.

## ✨ The Solution: Cold Start
Paste a founder's company URL, hold **Fn** and speak for 15 seconds about why you want to work there:
1. **Reads Public Pages**: Scrapes changelog, pricing, and about pages.
2. **Proof-Line Matcher**: Pairs the founder's recent updates with your specific past projects (e.g., your CRDT offline form filler).
3. **Multi-Channel Cadence**: Instantly drafts a specific Email, an X/Twitter DM, and follow-ups for Day 3 and Day 7.
4. **Specificity Scoring**: Flags generic phrases and grades the draft out of 100 on real product citations, word count (<90 words), and clear asks.
5. **Zero-OAuth Pipeline**: Track To-Send, Sent, and Replied founders. Clicking *Open in Gmail* launches prefilled Gmail compose tabs directly with zero OAuth tokens to break.
6. **Reply Coach**: Guides you on closing interviews when founders reply.

---

## 🛠️ Architecture & Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS & Lucide Icons
- **AI Engine**: GroqCloud API
  - Drafting: `openai/gpt-oss-120b` (high-reasoning, structured JSON output)
  - Fast Inference: `openai/gpt-oss-20b`
  - Audio Transcription: `whisper-large-v3-turbo` & Web Speech API
- **Deployment**: Vercel ready

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env.local` file in the root directory:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```
*(Get a key from [console.groq.com](https://console.groq.com/keys))*

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Hackathon Checklist
- [x] **Builders Track**: Full-stack Next.js web application.
- [x] **Voice-First Workflow**: Hold **Fn** or click mic to dictate your pitch.
- [x] **GroqCloud Powered**: Clean structured JSON output with zero markdown fences.
- [x] **Exact Design Match**: Implements both the Landing Page and App Workspace designs pixel-for-pixel.
- [x] **Zero OAuth Hassle**: Gmail compose URLs work across every browser and device.
