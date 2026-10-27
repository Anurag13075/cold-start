import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import {
  Link2,
  CheckSquare,
  Crosshair,
  Mic,
  Clock,
  BarChart3,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Rocket,
  GitPullRequest,
  FileText,
  Send,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafafc] text-slate-900 flex flex-col justify-between">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-[#fafafc]/90 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 h-18 py-4 flex items-center justify-between">
          <Logo size="md" href="/" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How it works
            </a>
            <a href="#features" className="hover:text-slate-900 transition-colors">
              Capabilities
            </a>
            <Link href="/demo" className="hover:text-blue-600 transition-colors font-semibold">
              Live Demo (3 runs)
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs md:text-sm font-semibold transition-all"
            >
              Public Demo
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-semibold transition-all shadow-sm active:scale-95"
            >
              Open App
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-16 pb-20 px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-800 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>WeMakeDevs &amp; Wispr Flow Hackathon Final Entry</span>
              </div>

              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
                Cold outreach that <br className="hidden sm:inline" />
                proves you did your <br className="hidden sm:inline" />
                homework.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Paste any startup URL. Cold Start crawls their live pages and changelog, discovers real founders and verified emails, pairs their updates with your projects, and drafts specific emails under 90 words.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/10 transition-all active:scale-95"
                >
                  <span>Start Outreach</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold transition-all shadow-xs"
                >
                  Try Live Demo (3 runs)
                </Link>
              </div>

              {/* Small Note */}
              <p className="text-xs text-slate-400 font-medium pt-1">
                Zero fake data. Built by voice with Wispr Flow. Zero-OAuth Gmail integration.
              </p>
            </div>

            {/* Right Hero Floating Preview Card */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 space-y-4 text-left">
                {/* Card Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono text-xs text-slate-700 font-semibold">
                    Live Company Research
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Crawl
                  </span>
                </div>

                {/* Subject Preview */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Email Subject
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    Your offline mode release, and a sync idea
                  </div>
                </div>

                {/* Email Body Preview */}
                <div className="text-xs text-slate-700 leading-relaxed space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100 font-sans">
                  <p>Hi Priya,</p>
                  <p>
                    I saw your update shipped in your <span className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-medium">Oct 20 changelog</span>. I built <span className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-medium">FormFlow</span> (voice form-filler that works offline-first), so I hit the identical local sync edge cases.
                  </p>
                  <p>
                    Could I send you a 2-minute walkthrough? I&apos;m a third-year CS student looking for a small engineering team.
                  </p>
                  <p className="text-slate-500">Anurag</p>
                </div>

                {/* Specificity Score Indicator */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Specificity: 94 / 100</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Strictly &lt; 90 words</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section id="how-it-works" className="py-20 bg-white border-y border-slate-200/60 px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Real Engineering
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950">
                Four steps. Zero fluff.
              </h2>
              <p className="text-slate-600 text-sm">
                Every outreach card is grounded in real facts from the company&apos;s site and your persistent profile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="font-bold text-slate-900 text-base">Paste Company URL</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Deep-crawls their home, about, changelog, careers, contact and public GitHub repository.
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-base">Find Real People</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Discovers founders and engineering leads with honesty badges: <em>Found on site</em>, <em>Public GitHub</em>, or <em>Guess</em>.
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="font-bold text-slate-900 text-base">Speak Your 15s Hook</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Hold F2 or use Wispr Flow to say why you want this company. Groq matches your project and drafts the outreach.
                </p>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h3 className="font-bold text-slate-900 text-base">Send via Gmail</h3>
                <p className="text-slate-600 text-xs leading-relaxed">
                  One-click opens Gmail compose pre-filled without OAuth. Automatically schedules Day 3 &amp; 7 follow-up reminders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Superchargers
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950">
              More ways to win the job
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                <Rocket className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Dedicated Pitch Page</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Generates a private web page titled <em>&ldquo;Built for [Company]&rdquo;</em> showcasing your 2 best projects with screenshots, code links, and view tracking.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Repo Scout</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Finds open beginner issues (<em>good first issue</em>, <em>help wanted</em>) in the company&apos;s open-source repositories matching your skills.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Tailored Resume (PDF)</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Reorders your resume bullets and skills so experience matching this company comes first. Exports a clean 1-page PDF.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                <Mic className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Voice Mock Interview</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Browser reads company-tailored questions out loud. You speak your answer, and Cold Start scores clarity, specificity, and filler words.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Autopilot Mode</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Paste up to 20 URLs at once. Rapid keyboard review (<kbd className="font-mono font-bold">A</kbd> Approve, <kbd className="font-mono font-bold">E</kbd> Edit, <kbd className="font-mono font-bold">S</kbd> Skip) with safe spacing limits.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Real Stats Only</h3>
              <p className="text-slate-600 text-xs leading-relaxed">
                Shows <em>&ldquo;Not enough data yet&rdquo;</em> if fewer than 5 emails have been sent. Real reply rates and project interest once verified.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div>
            Built for <strong>No Hands: The Wispr Challenge</strong> by WeMakeDevs &amp; Wispr Flow.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-blue-600 hover:underline">
              Public Demo
            </Link>
            <Link href="/app" className="text-slate-700 hover:underline">
              Workspace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
