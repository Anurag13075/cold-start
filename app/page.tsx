import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Waveform } from "@/components/Waveform";
import {
  Link2,
  CheckSquare,
  Crosshair,
  Mic,
  Clock,
  BarChart3,
  ArrowRight,
  Sparkles,
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
              Features
            </a>
          </nav>

          <Link
            href="/app"
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            Try the demo
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-16 pb-20 px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Free for students and job seekers</span>
              </div>

              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.08]">
                Cold emails that <br className="hidden sm:inline" />
                prove you did your <br className="hidden sm:inline" />
                homework.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Paste a founder&apos;s site, speak for 15 seconds, and get a specific email, a DM and
                follow-ups. Track every reply in one place.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/10 transition-all active:scale-95"
                >
                  <span>Try it with any URL</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/app"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold transition-all shadow-xs"
                >
                  Watch the 2-minute demo
                </Link>
              </div>

              {/* Small Note */}
              <p className="text-xs text-slate-400 font-medium pt-1">
                No sign-in needed. Built by voice with Wispr Flow.
              </p>
            </div>

            {/* Right Hero Floating Preview Card (Matches screenshot 1) */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 space-y-4 text-left">
                {/* Card Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono text-xs text-slate-700 font-semibold">
                    northwind.ai
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Page read
                  </span>
                </div>

                {/* Voice Bar */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Mic className="w-4 h-4" />
                  </div>
                  <Waveform isRecording={true} bars={12} className="flex-1" />
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    Hold Fn and talk
                  </span>
                </div>

                {/* Draft Snippet */}
                <div className="text-xs text-slate-800 leading-relaxed font-sans space-y-2 pt-1">
                  <p>
                    Hi Priya, I saw{" "}
                    <span className="bg-blue-50 text-blue-900 border-b border-blue-300 font-medium px-1 rounded-xs">
                      offline mode in your Oct 20 changelog
                    </span>
                    . I built{" "}
                    <span className="bg-indigo-50 text-indigo-900 border-b border-indigo-300 font-medium px-1 rounded-xs">
                      a voice form-filler that works offline-first
                    </span>
                    , so I&apos;ve hit the same sync edge cases. Could I send you a two-minute
                    walkthrough?
                  </p>
                </div>

                {/* Tag Pills */}
                <div className="flex items-center gap-2 pt-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200">
                    Changelog
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium border border-slate-200">
                    Pricing
                  </span>
                  <span className="ml-auto px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                    Specificity 92
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Row Section */}
        <section className="px-6 max-w-4xl mx-auto pb-20">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="pt-2 md:pt-0">
                <div className="text-3xl md:text-4xl font-black text-slate-900 font-mono">14</div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  emails sent in one week
                </div>
              </div>
              <div className="pt-4 md:pt-0">
                <div className="text-3xl md:text-4xl font-black text-slate-900 font-mono">3</div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  replies from founders
                </div>
              </div>
              <div className="pt-4 md:pt-0">
                <div className="text-3xl md:text-4xl font-black text-slate-900 font-mono">
                  90<span className="text-xl">s</span>
                </div>
                <div className="text-xs font-medium text-slate-500 mt-1">
                  per personalized email
                </div>
              </div>
            </div>
            <div className="text-center text-[11px] text-slate-400 font-medium pt-4 mt-4 border-t border-slate-100">
              Filled in from my own job hunt.
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-6 max-w-5xl mx-auto text-left">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-12">
            From a URL to a sent email in <br />
            under two minutes.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <span className="text-xs font-bold text-blue-600 font-mono">01</span>
              <h3 className="text-lg font-bold text-slate-900">Paste</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drop in a company or founder URL. Cold Start reads the public pages and pulls out
                what they actually ship.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <span className="text-xs font-bold text-blue-600 font-mono">02</span>
              <h3 className="text-lg font-bold text-slate-900">Speak</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hold Fn and say why you want to work there. Rambling is fine, it gets cleaned up.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <span className="text-xs font-bold text-blue-600 font-mono">03</span>
              <h3 className="text-lg font-bold text-slate-900">Send</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Review the draft, open it in Gmail, and the follow-ups are scheduled for you.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 max-w-5xl mx-auto text-left">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight mb-12">
            Everything a personal email <br />
            needs. Nothing it doesn&apos;t.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Link2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Grounded in the page</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every claim traces back to something on the founder&apos;s site, with the source shown
                next to it.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Specificity check</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Flags lines like &ldquo;I&apos;m passionate about...&rdquo; before you send them, and suggests
                a sharper version.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Crosshair className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Proof-line matcher</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Picks the one project of yours that is most relevant to this founder and leads with
                it.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Voice in, polish out</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Talk the way you would to a friend. The draft keeps your meaning and drops the filler.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Follow-up cadence</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Day 3 and day 7 follow-ups are drafted and queued, so no founder slips through.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Reply insights</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                See which openers and projects get replies, and do more of what works.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner (Matching screenshot 1 dark container) */}
        <section className="px-6 max-w-5xl mx-auto pb-24">
          <div className="bg-slate-950 text-white rounded-3xl p-10 md:p-14 text-center space-y-6 shadow-xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Send your first specific <br />
              email today.
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
              Paste a URL, say what you&apos;d say to a friend, and let Cold Start do the rest.
            </p>
            <div>
              <Link
                href="/app"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all shadow-md active:scale-95"
              >
                Try the demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <Logo size="sm" href="/" />
          <span>Built for No Hands: The Wispr Challenge</span>
        </div>
      </footer>
    </div>
  );
}
