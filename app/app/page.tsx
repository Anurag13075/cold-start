"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Waveform } from "@/components/Waveform";
import { ProfileManagerModal } from "@/components/ProfileManagerModal";
import { ReplyCoachModal } from "@/components/ReplyCoachModal";
import { AutopilotDrawer } from "@/components/AutopilotDrawer";
import { JobToolsModal } from "@/components/JobToolsModal";
import { RealStatsModal } from "@/components/RealStatsModal";
import { PeopleSelector } from "@/components/PeopleSelector";
import { SpecificityScorecard } from "@/components/SpecificityScorecard";
import {
  UserProfile,
  CompanyBrief,
  CompanyPerson,
  GeneratedDrafts,
  PipelineItem,
  PipelineStatus,
} from "@/lib/types";
import {
  INITIAL_USER_PROFILE,
  getStoredProfile,
  saveStoredProfile,
  getStoredPipeline,
  saveStoredPipeline,
  getStoredDoNotContact,
} from "@/lib/storage";
import {
  Mic,
  MicOff,
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
  Globe,
  User,
  Zap,
  BarChart2,
  Rocket,
  ShieldAlert,
  Calendar,
  Wand2,
  Share2,
} from "lucide-react";

export default function AppPage() {
  // Persistence state
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Active Research State
  const [urlInput, setUrlInput] = useState("");
  const [companyBrief, setCompanyBrief] = useState<CompanyBrief | null>(null);
  const [people, setPeople] = useState<CompanyPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<CompanyPerson | null>(null);
  const [drafts, setDrafts] = useState<GeneratedDrafts | null>(null);

  // Loading & Progress
  const [isResearching, setIsResearching] = useState(false);
  const [researchStep, setResearchStep] = useState<string>("");
  const [researchError, setResearchError] = useState<string>("");

  // Voice & Edits
  const [voiceNote, setVoiceNote] = useState("");
  const [voiceInstruction, setVoiceInstruction] = useState("");
  const [isRecordingHook, setIsRecordingHook] = useState(false);
  const [isRecordingEdit, setIsRecordingEdit] = useState(false);
  const [isUpdatingDraft, setIsUpdatingDraft] = useState(false);

  // Active Tab for Drafts
  const [activeDraftTab, setActiveDraftTab] = useState<
    "email" | "dm" | "linkedin" | "day3" | "day7"
  >("email");
  const [copiedDraft, setCopiedDraft] = useState(false);

  // Modals & Drawers
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAutopilotOpen, setIsAutopilotOpen] = useState(false);
  const [isJobToolsOpen, setIsJobToolsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [selectedReplyItem, setSelectedReplyItem] = useState<PipelineItem | null>(null);

  // Anti-repeat override warning state
  const [antiRepeatWarning, setAntiRepeatWarning] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Load pipeline on mount
  useEffect(() => {
    setMounted(true);
    setPipeline(getStoredPipeline());
    setUserProfile(getStoredProfile());
  }, []);

  // Keyboard shortcut listener: Hold F2 or Alt+V to dictate voice hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2" || (e.altKey && e.key === "v")) {
        e.preventDefault();
        if (!isRecordingHook) {
          startVoiceRecording((text) => setVoiceNote(text), setIsRecordingHook);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "F2" || (e.altKey && e.key === "v")) {
        e.preventDefault();
        if (isRecordingHook) {
          stopVoiceRecording(setIsRecordingHook);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isRecordingHook]);

  // Voice recording helper using Web Speech API
  const startVoiceRecording = (
    onText: (trans: string) => void,
    setRecordingState: (state: boolean) => void
  ) => {
    setRecordingState(true);
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (e: any) => {
        let transcript = "";
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        if (transcript.trim()) {
          onText(transcript);
        }
      };

      rec.onerror = () => setRecordingState(false);
      rec.onend = () => setRecordingState(false);
      rec.start();
      recognitionRef.current = rec;
    }
  };

  const stopVoiceRecording = (setRecordingState: (state: boolean) => void) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setRecordingState(false);
  };

  // Run Real Company Research
  const handleStartResearch = async (overrideRepeat = false) => {
    if (!urlInput.trim()) return;

    // Check anti-spam & anti-repeat
    const cleanDomain = urlInput
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];

    const dncList = getStoredDoNotContact();
    const isBlocked = dncList.some((dnc) => cleanDomain.includes(dnc.domainOrEmail.toLowerCase()));
    if (isBlocked) {
      setResearchError(`Domain ${cleanDomain} is on your Do-Not-Contact list.`);
      return;
    }

    if (!overrideRepeat) {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recentlySent = pipeline.find((p) => {
        if (!p.companyDomain.toLowerCase().includes(cleanDomain)) return false;
        if (!p.sentAt) return false;
        return new Date(p.sentAt).getTime() > thirtyDaysAgo;
      });

      if (recentlySent) {
        setAntiRepeatWarning(
          `You already sent an outreach email to ${recentlySent.companyName} on ${new Date(
            recentlySent.sentAt!
          ).toLocaleDateString()}. Re-contacting within 30 days is discouraged.`
        );
        return;
      }
    }

    setAntiRepeatWarning(null);
    setIsResearching(true);
    setResearchError("");
    setCompanyBrief(null);
    setDrafts(null);

    try {
      // Stage 1: Crawl real pages
      setResearchStep("Reading pages (home, about, team, changelog)...");
      const resScrape = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await resScrape.json();

      if (!resScrape.ok || !data.brief) {
        throw new Error(data.error || "Failed to research company pages");
      }

      setCompanyBrief(data.brief);
      setPeople(data.people || []);

      const recommendedPerson =
        data.people?.find((p: any) => p.isRecommended) || data.people?.[0] || null;
      setSelectedPerson(recommendedPerson);

      // Stage 2: Generate Grounded Outreach Drafts
      setResearchStep("Drafting high-specificity outreach with Groq...");
      const resDraft = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyBrief: data.brief,
          targetPerson: recommendedPerson,
          voiceNote: voiceNote.trim() || undefined,
          userProfile,
        }),
      });
      const draftData = await resDraft.json();

      if (!resDraft.ok || !draftData.drafts) {
        throw new Error(draftData.error || "Failed to generate outreach drafts");
      }

      setDrafts(draftData.drafts);
    } catch (err: any) {
      setResearchError(err.message || "Failed to complete company research");
    } finally {
      setIsResearching(false);
      setResearchStep("");
    }
  };

  // Re-draft with voice edit instruction
  const handleApplyVoiceEdit = async () => {
    if (!companyBrief || !drafts || !voiceInstruction.trim()) return;
    setIsUpdatingDraft(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyBrief,
          targetPerson: selectedPerson || undefined,
          voiceNote: voiceNote.trim() || undefined,
          voiceInstruction: voiceInstruction.trim(),
          currentDraft: drafts,
          userProfile,
        }),
      });
      const data = await res.json();
      if (res.ok && data.drafts) {
        setDrafts(data.drafts);
        setVoiceInstruction("");
      }
    } catch {
      // Continue
    } finally {
      setIsUpdatingDraft(false);
    }
  };

  // Specificity Scorecard: Apply 1-Click Fix for weak line
  const handleFixWeakLine = (oldLine: string, newLine: string) => {
    if (!drafts) return;
    const updatedBody = drafts.email.body.replace(oldLine, newLine);
    setDrafts({
      ...drafts,
      email: {
        ...drafts.email,
        body: updatedBody,
      },
      weakLines: drafts.weakLines.filter((wl) => wl.line !== oldLine),
      specificityScore: Math.min(100, drafts.specificityScore + 2),
    });
  };

  // Switch Target Recipient
  const handleSelectPerson = async (person: CompanyPerson) => {
    setSelectedPerson(person);
    if (!companyBrief || !drafts) return;

    setIsUpdatingDraft(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyBrief,
          targetPerson: person,
          voiceNote: voiceNote.trim() || undefined,
          userProfile,
        }),
      });
      const data = await res.json();
      if (res.ok && data.drafts) {
        setDrafts(data.drafts);
      }
    } catch {
      // Continue
    } finally {
      setIsUpdatingDraft(false);
    }
  };

  // Send via Gmail (Zero-OAuth Instant Send)
  const handleSendViaGmail = (item?: PipelineItem) => {
    const brief = item ? item.brief : companyBrief;
    const targetDrafts = item ? item.drafts : drafts;
    const person = item ? item.person : selectedPerson;

    if (!brief || !targetDrafts) return;

    const recipientEmail = person?.email || "";
    const subject = encodeURIComponent(targetDrafts.email.subject);
    const body = encodeURIComponent(targetDrafts.email.body);

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      recipientEmail
    )}&su=${subject}&body=${body}`;

    window.open(gmailUrl, "_blank");

    // Mark as Sent & Schedule Day 3 and Day 7 follow-up dates
    const now = new Date();
    const day3Date = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const day7Date = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const existingId = item ? item.id : `pipeline-${Date.now()}`;
    const updatedPipeline = [...pipeline];
    const existingIdx = updatedPipeline.findIndex((p) => p.id === existingId);

    const updatedItem: PipelineItem = {
      id: existingId,
      companyDomain: brief.domain,
      companyName: brief.name,
      companyUrl: brief.url,
      person: person || {
        id: "p1",
        name: "Founder",
        role: "Team",
        emailReliability: "Guess (unverified)",
        isRecommended: true,
      },
      status: "Sent",
      createdAt: item?.createdAt || now.toISOString(),
      sentAt: now.toISOString(),
      followUpDay3Due: day3Date,
      followUpDay7Due: day7Date,
      drafts: targetDrafts,
      brief,
    };

    if (existingIdx >= 0) {
      updatedPipeline[existingIdx] = updatedItem;
    } else {
      updatedPipeline.unshift(updatedItem);
    }

    setPipeline(updatedPipeline);
    saveStoredPipeline(updatedPipeline);
  };

  // Update status in pipeline
  const handleUpdateStatus = (id: string, newStatus: PipelineStatus) => {
    const updated = pipeline.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: newStatus,
          replyDate: newStatus === "Replied" ? new Date().toISOString() : item.replyDate,
        };
      }
      return item;
    });
    setPipeline(updated);
    saveStoredPipeline(updated);
  };

  // Follow-ups due today calculation
  const followUpsDueToday = pipeline.filter((item) => {
    if (["Replied", "Closed", "Interview"].includes(item.status)) return false;
    if (!item.followUpDay3Due) return false;
    const dueTime = new Date(item.followUpDay3Due).getTime();
    return Date.now() >= dueTime;
  });

  const getActiveDraftContent = () => {
    if (!drafts) return "";
    switch (activeDraftTab) {
      case "email":
        return drafts.email.body;
      case "dm":
        return drafts.dm.body;
      case "linkedin":
        return drafts.linkedIn.body;
      case "day3":
        return drafts.followUpDay3.body;
      case "day7":
        return drafts.followUpDay7.body;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Logo />
          </Link>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-semibold text-slate-500">
            Wispr Challenge Workspace
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Autopilot Button */}
          <button
            onClick={() => setIsAutopilotOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            <span>Autopilot (Batch URLs)</span>
          </button>

          {/* Superchargers */}
          {companyBrief && (
            <button
              onClick={() => setIsJobToolsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
            >
              <Rocket className="w-3.5 h-3.5 text-blue-600" />
              <span>Job Tools &amp; Pitch</span>
            </button>
          )}

          {/* Real Stats Button */}
          <button
            onClick={() => setIsStatsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
          >
            <BarChart2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Stats</span>
          </button>

          {/* Profile Manager */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-black text-xs font-bold transition-colors shadow-sm"
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile ({userProfile.projects.length} Projects)</span>
          </button>
        </div>
      </header>

      {/* Follow-Ups Due Today Alert Banner */}
      {followUpsDueToday.length > 0 && (
        <div className="bg-amber-500 text-white px-6 py-2.5 flex items-center justify-between text-xs font-medium shadow-inner">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-spin text-white" />
            <span>
              <strong>Action required:</strong> You have {followUpsDueToday.length} follow-up(s) due today!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] opacity-90">
              Next: {followUpsDueToday[0].companyName}
            </span>
            <button
              onClick={() => handleSendViaGmail(followUpsDueToday[0])}
              className="px-2.5 py-1 bg-white text-amber-800 rounded font-bold text-xs hover:bg-amber-50"
            >
              1-Click Send via Gmail
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 space-y-6">
        {/* Research Input Bar */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleStartResearch()}
                placeholder="Paste founder's company URL to research for real (e.g. resend.com, vercel.com)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => handleStartResearch()}
              disabled={isResearching || !urlInput.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 shadow-sm"
            >
              {isResearching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{researchStep || "Researching..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Research &amp; Draft</span>
                </>
              )}
            </button>
          </div>

          {/* Anti-Repeat 30-Day Warning Modal / Alert */}
          {antiRepeatWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{antiRepeatWarning}</span>
              </div>
              <button
                onClick={() => handleStartResearch(true)}
                className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px] hover:bg-amber-700 shrink-0"
              >
                Override &amp; Draft Anyway
              </button>
            </div>
          )}

          {researchError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{researchError}</span>
            </div>
          )}

          {/* Voice Hook Bar (Spoken note why I want this company) */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2 text-xs">
            <div className="flex items-center gap-2 shrink-0 font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>15s Spoken Hook:</span>
            </div>

            <div className="flex-1 w-full flex items-center gap-2">
              <input
                type="text"
                value={voiceNote}
                onChange={(e) => setVoiceNote(e.target.value)}
                placeholder="Hold F2 or click mic: speak 15s why you want this company..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
              />

              {isRecordingHook ? (
                <button
                  onClick={() => stopVoiceRecording(setIsRecordingHook)}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold flex items-center gap-1 shrink-0 animate-pulse"
                >
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={() =>
                    startVoiceRecording((text) => setVoiceNote(text), setIsRecordingHook)
                  }
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 shrink-0"
                  title="Speak hook using mic (or Wispr Flow)"
                >
                  <Mic className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mic [F2]</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Research Results Workspace */}
        {companyBrief && drafts ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
            {/* Left Column: Discovered Intelligence & People */}
            <div className="lg:col-span-4 space-y-4">
              {/* Company Brief Card */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{companyBrief.name}</h3>
                  <a
                    href={companyBrief.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-slate-700 text-xs flex items-center gap-1"
                  >
                    <span>{companyBrief.domain}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="text-xs text-slate-600">
                  <strong>What they make:</strong> {companyBrief.whatTheyMake}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="font-semibold text-slate-700 text-xs mb-1">
                    Verified Shipments:
                  </div>
                  <div className="space-y-1">
                    {companyBrief.recentShipped.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 bg-slate-50 border rounded text-[11px] text-slate-700"
                      >
                        <span className="font-bold text-slate-900">{s.title}:</span> {s.details}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* People & Founders Discovery */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <PeopleSelector
                  people={people}
                  selectedPersonId={selectedPerson?.id || ""}
                  onSelectPerson={handleSelectPerson}
                />
              </div>

              {/* Specificity Scorecard & Weak Line Fixer */}
              <SpecificityScorecard drafts={drafts} onFixWeakLine={handleFixWeakLine} />
            </div>

            {/* Right Column: Grounded Outreach Drafts & Voice Rewriting */}
            <div className="lg:col-span-8 space-y-4">
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                {/* Draft Navigation Tabs */}
                <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      onClick={() => setActiveDraftTab("email")}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        activeDraftTab === "email"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Email (&lt;90w)
                    </button>
                    <button
                      onClick={() => setActiveDraftTab("dm")}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        activeDraftTab === "dm"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      X DM
                    </button>
                    <button
                      onClick={() => setActiveDraftTab("linkedin")}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        activeDraftTab === "linkedin"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      LinkedIn Note
                    </button>
                    <button
                      onClick={() => setActiveDraftTab("day3")}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        activeDraftTab === "day3"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Day 3 Follow-Up
                    </button>
                    <button
                      onClick={() => setActiveDraftTab("day7")}
                      className={`px-3 py-1.5 rounded-lg transition-colors ${
                        activeDraftTab === "day7"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Day 7 Final
                    </button>
                  </div>

                  {/* Actions: Copy & Send via Gmail */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(getActiveDraftContent())}
                      className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      {copiedDraft ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedDraft ? "Copied" : "Copy"}</span>
                    </button>

                    <button
                      onClick={() => handleSendViaGmail()}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send via Gmail (No OAuth)</span>
                    </button>
                  </div>
                </div>

                {/* Email Subject line if on email tab */}
                {activeDraftTab === "email" && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 font-semibold mr-2">Subject:</span>
                      <span className="font-bold text-slate-900">{drafts.email.subject}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      To: {selectedPerson?.email || `founder@${companyBrief.domain}`}
                    </span>
                  </div>
                )}

                {/* Draft Body Content */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans whitespace-pre-line leading-relaxed min-h-[140px]">
                  {getActiveDraftContent()}
                </div>

                {/* Grounded Citations (Only on Email tab) */}
                {activeDraftTab === "email" && drafts.email.groundedCitations?.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="font-semibold text-slate-700 text-xs">
                      Grounded Citations:
                    </div>
                    <div className="space-y-1">
                      {drafts.email.groundedCitations.map((cite, i) => (
                        <div
                          key={i}
                          className="p-2 bg-blue-50/50 border border-blue-200/60 rounded-lg text-[11px] text-blue-950 flex items-start justify-between gap-2"
                        >
                          <div>
                            <span className="font-bold text-blue-900">{cite.source}:</span>{" "}
                            <span>&ldquo;{cite.text}&rdquo;</span>
                          </div>
                          {cite.url && (
                            <a
                              href={cite.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 shrink-0 p-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spoken Voice Rewrite / Instruction Input */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={voiceInstruction}
                      onChange={(e) => setVoiceInstruction(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyVoiceEdit()}
                      placeholder="Speak voice edit: e.g. 'Make it punchier', 'Cite my Rust project instead'..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>

                  {isRecordingEdit ? (
                    <button
                      onClick={() => stopVoiceRecording(setIsRecordingEdit)}
                      className="px-3 py-2 bg-red-600 text-white rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 animate-pulse"
                    >
                      <MicOff className="w-3.5 h-3.5" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        startVoiceRecording(
                          (text) => setVoiceInstruction(text),
                          setIsRecordingEdit
                        )
                      }
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center gap-1 shrink-0"
                    >
                      <Mic className="w-3.5 h-3.5 text-blue-600" />
                      <span>Voice Edit</span>
                    </button>
                  )}

                  <button
                    onClick={handleApplyVoiceEdit}
                    disabled={isUpdatingDraft || !voiceInstruction.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 disabled:opacity-50"
                  >
                    {isUpdatingDraft ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    <span>Update Draft</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Workspace Prompt */
          <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No company researched yet</h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              Paste any startup URL in the search bar above (e.g. <code>resend.com</code> or <code>linear.app</code>). Cold Start will inspect their changelog, discover their founders, and draft an outreach email grounded in verified facts.
            </p>
          </div>
        )}

        {/* Real Outreach Pipeline Board */}
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">Outreach Pipeline</h3>
              <span className="text-xs text-slate-500 font-mono">
                ({pipeline.length} items tracked)
              </span>
            </div>

            <div className="text-xs text-slate-500">
              Auto-schedules Day 3 and Day 7 follow-up reminders
            </div>
          </div>

          {pipeline.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
              Pipeline is empty. Every email sent via Gmail will be tracked here with automated follow-up schedules.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {pipeline.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-colors shadow-sm text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{item.companyName}</div>
                      <div className="text-[11px] text-slate-500">{item.person.name}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        item.status === "Replied"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.status === "Sent"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 line-clamp-1 italic">
                    &ldquo;{item.drafts?.email?.subject}&rdquo;
                  </div>

                  {item.sentAt && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Sent: {new Date(item.sentAt).toLocaleDateString()}
                    </div>
                  )}

                  {/* Follow-up reminder indicator */}
                  {item.status !== "Replied" && item.followUpDay3Due && (
                    <div className="text-[10px] text-amber-700 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>
                        Day 3 due: {new Date(item.followUpDay3Due).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Actions: Send Gmail or Mark Replied */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleSendViaGmail(item)}
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Gmail
                    </button>

                    <button
                      onClick={() => {
                        handleUpdateStatus(item.id, "Replied");
                        setSelectedReplyItem(item);
                      }}
                      className="text-emerald-700 hover:text-emerald-900 text-[11px] font-semibold"
                    >
                      Mark Replied
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals & Drawers */}
      <ProfileManagerModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={userProfile}
        onProfileUpdate={(updated) => setUserProfile(updated)}
      />

      <AutopilotDrawer
        isOpen={isAutopilotOpen}
        onClose={() => setIsAutopilotOpen(false)}
        userProfile={userProfile}
        onSelectForEdit={(item) => {
          if (item.companyBrief && item.drafts) {
            setCompanyBrief(item.companyBrief);
            setDrafts(item.drafts);
            setSelectedPerson(item.selectedPerson || null);
          }
        }}
        onPipelineUpdated={() => setPipeline(getStoredPipeline())}
      />

      {companyBrief && (
        <JobToolsModal
          isOpen={isJobToolsOpen}
          onClose={() => setIsJobToolsOpen(false)}
          userProfile={userProfile}
          companyBrief={companyBrief}
        />
      )}

      <RealStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        pipeline={pipeline}
      />

      {selectedReplyItem && (
        <ReplyCoachModal
          isOpen={!!selectedReplyItem}
          onClose={() => setSelectedReplyItem(null)}
          pipelineItem={selectedReplyItem}
        />
      )}
    </div>
  );
}
