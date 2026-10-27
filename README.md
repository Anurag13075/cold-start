# Cold Start 🚀
> **Cold outreach that proves you did your homework.**  
> Built for **No Hands: The Wispr Challenge** (WeMakeDevs × Wispr Flow).

---

## 💡 The Problem
Job-hunting by cold outreach is broken:
- Generic outreach (*"Hi, I love your product and am passionate about..."*) gets an 8% or worse reply rate.
- Truly personalized emails that cite recent changelogs, specific edge cases, and relevant portfolio projects take **30 to 45 minutes** each.
- Job seekers either send spammy templates that burn bridges or burn out after writing 4 emails.

---

## ✨ Cold Start: Built to Do Real Work
Zero fake or placeholder data. Every card, number, and citation comes from live company pages, public GitHub repositories, and your saved profile:

1. **Persistent Sender Profile**:
   - **GitHub Importer**: Fetches real repositories, descriptions, and languages.
   - **Resume Parser**: Parses education, skills, and experience with Groq into structured data.
   - **Screenshot Uploads**: Attaches screenshots to each project for automatic inclusion in Pitch Pages.
   - **Voice Onboarding**: 3-question guided audio interview to populate your profile automatically.

2. **Real Deep Research**:
   - Concurrently crawls `/`, `/about`, `/team`, `/changelog`, `/careers`, `/contact`, and public GitHub.
   - Discovers real founders and engineering leads with honesty badges:
     - `Found on their site`
     - `From public GitHub`
     - `Guess (unverified)` (never claims an email is verified unless actually checked)
   - Fallback contact options (X DM or contact address) and a recommended first-contact reason.

3. **Grounded Generation (<90 words)**:
   - Pairs target company's latest shipment with your most relevant project.
   - Generates Email (<90 words, single clear ask), Twitter/X DM, LinkedIn connection note, Day 3 follow-up, and Day 7 final follow-up.
   - Specificity Scorecard (0–100) with **1-click weak line fixes**.
   - Voice Rewriting: dictate revisions like *"make it punchier"* or *"mention my Rust project instead"*.

4. **Zero-OAuth Pipeline & Follow-up Scheduler**:
   - 1-click "Send via Gmail" opens pre-filled Gmail compose tabs directly (zero OAuth keys to break).
   - Automatically schedules Day 3 and Day 7 follow-up reminders.
   - "Follow-ups due today" alert banner at top of workspace with 1-click send.
   - Marking a company `Replied` halts follow-ups and launches the **Reply Coach**.
   - 30-day anti-repeat protection & Do-Not-Contact list.

5. **Autopilot Mode (Batch URLs)**:
   - Paste up to 20 company URLs at once.
   - Background research and draft generation.
   - Rapid keyboard review mode: `A` to Approve, `E` to Edit, `S` to Skip.
   - Safe spacing schedule limits (max 15/day) to keep email domain reputation healthy.

6. **More Ways to Win the Job**:
   - **Dedicated Pitch Page** (`/pitch/[domain]`): Private web link showing 2 matching projects with uploaded screenshots, live links, and real view tracking.
   - **Repo Scout**: Finds open `good first issue` and `help wanted` issues on company GitHub repos.
   - **Tailored Resume (PDF)**: Reorders skills and projects matching target company; exports clean 1-page PDF.
   - **Voice Mock Interview**: Browser reads company-tailored interview questions out loud; candidate speaks answer; evaluates clarity, specificity, and filler words count.

7. **Real Stats Only**:
   - Shows *"Not enough data yet"* if fewer than 5 emails sent.
   - Once >= 5 sent: displays real reply rates, top subject lines, and which user projects generated replies.

8. **Public Demo**:
   - Available at `/demo` for judges and visitors without logging in (3 runs per visitor quota).

---

## 🛠️ Architecture & Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS & Lucide Icons
- **AI Engine**: GroqCloud API
  - Drafting & Intelligence: `openai/gpt-oss-120b` & `openai/gpt-oss-20b`
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
*(Get a key from [console.groq.com/keys](https://console.groq.com/keys))*

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
