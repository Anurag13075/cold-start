"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Waveform } from "@/components/Waveform";
import { ProfileModal } from "@/components/ProfileModal";
import { ReplyCoachModal } from "@/components/ReplyCoachModal";
import {
  DEFAULT_USER_PROFILE,
  INITIAL_COMPANY,
  INITIAL_DRAFTS,
  INITIAL_PIPELINE,
  REPLY_METRICS,
} from "@/lib/sample-data";
import {
  ScrapedCompany,
  GeneratedDrafts,
  PipelineItem,
  UserProfile,
} from "@/lib/types";
import {
  Mic,
  Copy,
  ExternalLink,
  RotateCcw,
  Check,
  Sparkles,
  ArrowRight,
  Send,
  Loader2,
  AlertCircle,
  Clock,
  MessageSquare,
} from "lucide-react";

export default function AppPage() {
  // State
  const [urlInput, setUrlInput] = useState("northwind.ai");
  const [company, setCompany] = useState<ScrapedCompany>(INITIAL_COMPANY);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [drafts, setDrafts] = useState<GeneratedDrafts>(INITIAL_DRAFTS);
  const [pipeline, setPipeline] = useState<PipelineItem[]>(INITIAL_PIPELINE);
  const [activeTab, setActiveTab] = useState<"email" | "dm" | "day3" | "day7">("email");

  const [voiceNote, setVoiceNote] = useState(
    "I built FormFlow, a voice form-filler that works offline-first, and I want to work on sync."
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReadingPage, setIsReadingPage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pipelineAdded, setPipelineAdded] = useState(false);

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedReplyItem, setSelectedReplyItem] = useState<PipelineItem | null>(null);

  // Recognition ref
  const recognitionRef = useRef<any>(null);

  // Keyboard shortcut listener for Fn key or hold to speak
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Fn or Alt key or ` key for hold to speak
      if (e.key === "F2" || (e.altKey && e.key === "v")) {
        e.preventDefault();
        if (!isRecording) {
          startListening();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "F2" || (e.altKey && e.key === "v")) {
        e.preventDefault();
        if (isRecording) {
          stopListening();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isRecording]);

  // Voice recording toggle using browser Web Speech API
  const startListening = () => {
    setIsRecording(true);
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setVoiceNote(transcript);
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch {}
    } else {
      // Simulation if microphone permission is absent
      const simulatedNotes = [
        `I built ${userProfile.activeProject}, and I want to work on ${company.name}'s offline sync infrastructure.`,
        `Saw your changelog on conflict-free data types. Built ${userProfile.activeProject} with similar local-first sync.`,
        `I'm a CS student focused on distributed state. Would love to send a two-minute walkthrough of ${userProfile.activeProject}.`,
      ];
      const pick = simulatedNotes[Math.floor(Math.random() * simulatedNotes.length)];
      setTimeout(() => {
        setVoiceNote(pick);
        setIsRecording(false);
      }, 1500);
    }
  };

  const stopListening = () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopListening();
      // Auto-trigger regeneration on finish recording
      generateOutreach(company, voiceNote, userProfile);
    } else {
      startListening();
    }
  };

  // Read URL handler
  const handleReadPage = async () => {
    if (!urlInput.trim()) return;
    setIsReadingPage(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await res.json();
      if (data.company) {
        setCompany(data.company);
        // Regenerate drafts with new company
        await generateOutreach(data.company, voiceNote, userProfile);
      }
    } catch {
      // Fallback
    } finally {
      setIsReadingPage(false);
    }
  };

  // Generate outreach call
  const generateOutreach = async (
    targetCompany: ScrapedCompany,
    note: string,
    profile: UserProfile
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: targetCompany,
          voiceNote: note,
          userProfile: profile,
        }),
      });
      const data = await res.json();
      if (data.drafts) {
        setDrafts(data.drafts);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Copy handler
  const handleCopy = () => {
    let contentToCopy = drafts.email.body;
    if (activeTab === "dm") contentToCopy = drafts.dm.body;
    if (activeTab === "day3") contentToCopy = drafts.followUpDay3.body;
    if (activeTab === "day7") contentToCopy = drafts.followUpDay7.body;

    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Add to pipeline
  const handleAddToPipeline = () => {
    const existing = pipeline.find((p) => p.domain === company.domain);
    if (!existing) {
      const newItem: PipelineItem = {
        id: `pipe-${Date.now()}`,
        companyName: company.name,
        domain: company.domain,
        avatarLetter: company.name.slice(0, 1).toUpperCase(),
        avatarBgColor: "bg-blue-100 text-blue-700",
        status: "sent",
        timeAgo: "Just now",
        lastSubject: drafts.email.subject,
        lastMessageSnippet: drafts.email.body.slice(0, 60) + "...",
      };
      setPipeline([newItem, ...pipeline]);
    }
    setPipelineAdded(true);
    setTimeout(() => setPipelineAdded(false), 2000);
  };

  // Swap active project
  const handleSwapProject = () => {
    const currentIndex = userProfile.projects.findIndex(
      (p) => p.name === userProfile.activeProject
    );
    const nextIndex = (currentIndex + 1) % userProfile.projects.length;
    const nextProject = userProfile.projects[nextIndex];
    const updatedProfile = {
      ...userProfile,
      activeProject: nextProject.name,
    };
    setUserProfile(updatedProfile);

    // Update voice note and regenerate
    const newNote = `I built ${nextProject.name}, ${nextProject.description}, and I want to work with ${company.name}.`;
    setVoiceNote(newNote);
    generateOutreach(company, newNote, updatedProfile);
  };

  // Gmail compose link
  const currentSubject =
    activeTab === "email"
      ? drafts.email.subject
      : activeTab === "day3"
      ? drafts.followUpDay3.subject
      : activeTab === "day7"
      ? drafts.followUpDay7.subject
      : `Quick note for ${company.name}`;

  const currentBody =
    activeTab === "email"
      ? drafts.email.body
      : activeTab === "dm"
      ? drafts.dm.body
      : activeTab === "day3"
      ? drafts.followUpDay3.body
      : drafts.followUpDay7.body;

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
    currentSubject
  )}&body=${encodeURIComponent(currentBody)}`;

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-slate-900 flex flex-col font-sans">
      {/* Top Navbar matching screenshot 2 */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <Logo size="md" href="/" />

          {/* Omnibox URL input */}
          <div className="flex-1 max-w-xl mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReadPage()}
                placeholder="founder's website or company domain (e.g. northwind.ai)"
                className="w-full px-4 py-2 text-sm rounded-full border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-slate-800"
              />
            </div>
            <button
              onClick={handleReadPage}
              disabled={isReadingPage}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              {isReadingPage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Reading...</span>
                </>
              ) : (
                <span>Read page</span>
              )}
            </button>
          </div>

          {/* Right Status Indicator & Avatar */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Flow ready, hold Fn</span>
            </div>

            {/* Profile Avatar Button */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              title="Edit sender profile & projects"
              className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 font-bold text-xs flex items-center justify-center transition-all shadow-xs"
            >
              {userProfile.name.slice(0, 1)}
            </button>
          </div>
        </div>
      </header>

      {/* Main App 2-Column Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Company Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 font-bold text-lg flex items-center justify-center border border-blue-100 flex-shrink-0">
                    {company.name.slice(0, 1)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                      {company.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">{company.tagline}</p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full whitespace-nowrap">
                  {company.sources.length} sources read
                </span>
              </div>

              {/* Source tags */}
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                {company.sources.map((src) => (
                  <span
                    key={src.id}
                    className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-medium hover:border-slate-300 transition-colors cursor-default"
                    title={src.snippet}
                  >
                    {src.title}
                  </span>
                ))}
              </div>

              {/* Voice Input Banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                <button
                  onClick={toggleRecording}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-all shadow-sm flex-shrink-0 ${
                    isRecording
                      ? "bg-red-500 animate-pulse scale-105"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  title="Click to dictate or hold Fn"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <Waveform isRecording={isRecording} bars={10} className="hidden sm:flex" />

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700 italic truncate font-sans">
                    &ldquo;{voiceNote}&rdquo;
                  </p>
                </div>

                <button
                  onClick={toggleRecording}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-1 flex-shrink-0"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>{isRecording ? "Finish" : "Re-record"}</span>
                </button>
              </div>
            </div>

            {/* Card 2: Generated Output & Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
              {/* Tab Navigation */}
              <div className="flex items-center gap-6 border-b border-slate-100 text-xs font-semibold text-slate-500">
                <button
                  onClick={() => setActiveTab("email")}
                  className={`pb-2.5 transition-all relative ${
                    activeTab === "email"
                      ? "text-blue-600 border-b-2 border-blue-600 font-bold"
                      : "hover:text-slate-800"
                  }`}
                >
                  Email
                </button>
                <button
                  onClick={() => setActiveTab("dm")}
                  className={`pb-2.5 transition-all relative ${
                    activeTab === "dm"
                      ? "text-blue-600 border-b-2 border-blue-600 font-bold"
                      : "hover:text-slate-800"
                  }`}
                >
                  X DM
                </button>
                <button
                  onClick={() => setActiveTab("day3")}
                  className={`pb-2.5 transition-all relative ${
                    activeTab === "day3"
                      ? "text-blue-600 border-b-2 border-blue-600 font-bold"
                      : "hover:text-slate-800"
                  }`}
                >
                  Follow-up, day 3
                </button>
                <button
                  onClick={() => setActiveTab("day7")}
                  className={`pb-2.5 transition-all relative ${
                    activeTab === "day7"
                      ? "text-blue-600 border-b-2 border-blue-600 font-bold"
                      : "hover:text-slate-800"
                  }`}
                >
                  Follow-up, day 7
                </button>
              </div>

              {/* Tab Content Display */}
              <div className="space-y-4">
                {/* Subject Line (For Email and Follow-ups) */}
                {activeTab !== "dm" && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Subject
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 font-sans">
                      {currentSubject}
                    </h3>
                  </div>
                )}

                {/* Body Content */}
                <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap space-y-3 pt-1">
                  {activeTab === "email" ? (
                    // Render highlighted email body matching screenshot 2
                    <div>
                      <p className="mb-3">Hi Priya,</p>
                      <p className="mb-3 leading-loose">
                        I saw{" "}
                        <span className="bg-slate-100 text-slate-900 border-b-2 border-blue-300 font-medium px-1 rounded-xs">
                          offline mode shipped in your Oct 20 changelog
                        </span>
                        . I built{" "}
                        <span className="bg-slate-100 text-slate-900 border-b-2 border-indigo-300 font-medium px-1 rounded-xs">
                          FormFlow, a voice form-filler that works offline-first
                        </span>
                        , so I&apos;ve hit the same sync edge cases.
                      </p>
                      <p className="mb-3 leading-relaxed">
                        Could I send you a two-minute walkthrough? I&apos;m a third-year CS student
                        looking for a role on a small team.
                      </p>
                      <p>Anurag</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100 text-slate-800 text-xs leading-relaxed font-sans">
                      {currentBody}
                    </div>
                  )}
                </div>

                {/* Footnote & Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 font-medium">
                    <span className="bg-slate-100 border-b-2 border-blue-400 font-semibold text-slate-800 px-1 py-0.5 rounded-xs">
                      Highlighted
                    </span>{" "}
                    lines come from a source
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleAddToPipeline}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-700 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                    >
                      {pipelineAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Added!</span>
                        </>
                      ) : (
                        <span>Add to pipeline</span>
                      )}
                    </button>

                    <a
                      href={gmailComposeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <span>Open in Gmail</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Specificity Score & Checks (Matching screenshot 2) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* Score */}
                <div className="sm:col-span-3 flex sm:flex-col items-center sm:items-start gap-2">
                  <span className="text-5xl font-black text-blue-600 font-mono tracking-tight">
                    {drafts.specificityScore}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Specificity
                  </span>
                </div>

                {/* 4 Check Items */}
                <div className="sm:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Names a real product detail</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>One clear ask</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Under 90 words</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="text-amber-500 font-bold">!</span>
                    <span>
                      Matched project: <strong>{userProfile.activeProject}</strong>.{" "}
                      <button
                        onClick={handleSwapProject}
                        className="text-blue-600 hover:text-blue-700 font-semibold underline"
                      >
                        Swap?
                      </button>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN ================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Sample Data Metrics */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                THIS WEEK, SAMPLE DATA
              </span>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-3xl font-black text-slate-900 font-mono">14</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">sent</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900 font-mono">3</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">replies</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900 font-mono">90s</div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">per email</div>
                </div>
              </div>
            </div>

            {/* Card 2: Pipeline Board */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
              <h3 className="font-bold text-slate-900 text-base">Pipeline</h3>

              {/* Section: Follow-up Due Today */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  FOLLOW-UP DUE TODAY
                </span>

                <div className="space-y-2.5">
                  {/* Lumen Health */}
                  <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        L
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 truncate">
                          Lumen Health
                        </div>
                        <div className="text-[10px] text-slate-400">Sent 3 days ago</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("day3");
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap shadow-2xs"
                    >
                      Draft day 3
                    </button>
                  </div>

                  {/* Parcel */}
                  <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        P
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 truncate">Parcel</div>
                        <div className="text-[10px] text-slate-400">Sent 3 days ago</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("day3");
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap shadow-2xs"
                    >
                      Draft day 3
                    </button>
                  </div>
                </div>
              </div>

              {/* Section: Sent */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  SENT
                </span>

                {/* Atlas Robotics */}
                <div className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      A
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        Atlas Robotics
                      </div>
                      <div className="text-[10px] text-slate-400">Sent yesterday</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-full bg-slate-100">
                    Waiting
                  </span>
                </div>
              </div>

              {/* Section: Replied */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  REPLIED
                </span>

                {/* Orbit Labs */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      O
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        Orbit Labs
                      </div>
                      <div className="text-[10px] text-slate-400">Replied 2 hours ago</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                      Replied
                    </span>
                    <button
                      onClick={() => {
                        const orbitItem = pipeline.find((p) => p.id === "orbit");
                        if (orbitItem) setSelectedReplyItem(orbitItem);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                    >
                      Reply coach
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: What gets replies */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">What gets replies</h3>
                <span className="text-[11px] text-slate-400">Sample data</span>
              </div>

              <div className="space-y-3.5">
                {/* Bar 1 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 font-semibold">
                      Cites a recent changelog entry
                    </span>
                    <span className="text-blue-600 font-bold font-mono">41%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: "41%" }}
                    />
                  </div>
                </div>

                {/* Bar 2 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Generic opener</span>
                    <span className="text-slate-500 font-mono">8%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-300 h-2 rounded-full transition-all duration-500"
                      style={{ width: "8%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={userProfile}
        onSave={(updated) => {
          setUserProfile(updated);
          generateOutreach(company, voiceNote, updated);
        }}
      />

      <ReplyCoachModal
        isOpen={!!selectedReplyItem}
        onClose={() => setSelectedReplyItem(null)}
        item={selectedReplyItem}
      />
    </div>
  );
}
