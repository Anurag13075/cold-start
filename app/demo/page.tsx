"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CompanyBrief, CompanyPerson, GeneratedDrafts, UserProfile } from "@/lib/types";
import { getDemoQuota, decrementDemoQuota, INITIAL_USER_PROFILE } from "@/lib/storage";
import { SpecificityScorecard } from "@/components/SpecificityScorecard";
import { PeopleSelector } from "@/components/PeopleSelector";
import {
  Globe,
  Sparkles,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";

export default function DemoPage() {
  const [quota, setQuota] = useState(3);
  const [urlInput, setUrlInput] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [researchStep, setResearchStep] = useState<string>("");
  const [companyBrief, setCompanyBrief] = useState<CompanyBrief | null>(null);
  const [people, setPeople] = useState<CompanyPerson[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<CompanyPerson | null>(null);
  const [drafts, setDrafts] = useState<GeneratedDrafts | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setQuota(getDemoQuota());
  }, []);

  const handleRunDemo = async () => {
    if (!urlInput.trim()) return;
    if (quota <= 0) {
      setErrorMsg("Demo run quota reached (3 runs per visitor).");
      return;
    }

    setIsResearching(true);
    setErrorMsg("");
    setCompanyBrief(null);
    setDrafts(null);

    try {
      // Step 1: Real research
      setResearchStep("Reading pages, changelog & team...");
      const resResearch = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      });

      const resData = await resResearch.json();
      if (!resResearch.ok || !resData.brief) {
        throw new Error(resData.error || "Failed to research company URL");
      }

      setCompanyBrief(resData.brief);
      setPeople(resData.people || []);
      const primaryPerson = resData.people?.find((p: any) => p.isRecommended) || resData.people?.[0];
      setSelectedPerson(primaryPerson || null);

      // Step 2: Real generation
      setResearchStep("Writing grounded drafts with Groq...");
      const resDraft = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyBrief: resData.brief,
          targetPerson: primaryPerson,
          userProfile: INITIAL_USER_PROFILE,
        }),
      });

      const draftData = await resDraft.json();
      if (!resDraft.ok || !draftData.drafts) {
        throw new Error(draftData.error || "Failed to generate outreach drafts");
      }

      setDrafts(draftData.drafts);

      // Decrement quota
      const remaining = decrementDemoQuota();
      setQuota(remaining);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during live demo research");
    } finally {
      setIsResearching(false);
      setResearchStep("");
    }
  };

  const handleFixWeakLine = (oldLine: string, newLine: string) => {
    if (!drafts) return;
    const updatedEmailBody = drafts.email.body.replace(oldLine, newLine);
    setDrafts({
      ...drafts,
      email: {
        ...drafts.email,
        body: updatedEmailBody,
      },
      weakLines: drafts.weakLines.filter((wl) => wl.line !== oldLine),
      specificityScore: Math.min(100, drafts.specificityScore + 2),
    });
  };

  const copyDraft = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Logo />
          </Link>
          <span className="text-slate-300">/</span>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
            Live Public Demo
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{quota} / 3 Demo Runs Remaining</span>
          </div>

          <Link
            href="/app"
            className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
          >
            Open Full App
          </Link>
        </div>
      </header>

      {/* Main Demo Workspace */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Banner */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
              Real Work In Action
            </span>
            <span className="text-xs text-slate-400">• Zero mock data</span>
          </div>

          <h1 className="text-2xl font-black text-slate-900">
            Test Cold Start on Any Tech Startup
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl">
            Paste any company URL below. Cold Start will deep-crawl their live pages, inspect their changelog, discover their founders, and draft a high-specificity email grounded in verified facts.
          </p>

          {/* URL Input Form */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunDemo()}
                placeholder="Paste company URL, e.g. linear.app, resend.com, vercel.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleRunDemo}
              disabled={isResearching || !urlInput.trim() || quota <= 0}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isResearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{researchStep || "Running..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Research &amp; Draft</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Results Workspace */}
        {companyBrief && drafts && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
            {/* Left Column: Discovered Intelligence */}
            <div className="lg:col-span-5 space-y-4">
              {/* Company Brief Card */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">{companyBrief.name}</h3>
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

                <div className="text-xs text-slate-600">
                  <strong>Target audience:</strong> {companyBrief.whoItIsFor}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="font-semibold text-slate-800 text-xs mb-1.5">
                    Verified Recent Releases:
                  </div>
                  <div className="space-y-1.5">
                    {companyBrief.recentShipped.map((s, i) => (
                      <div key={i} className="p-2 bg-slate-50 border rounded-lg text-[11px] text-slate-700">
                        <div className="font-bold text-slate-900">{s.title}</div>
                        <div className="text-slate-500 mt-0.5">{s.details}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Discovered People */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <PeopleSelector
                  people={people}
                  selectedPersonId={selectedPerson?.id || ""}
                  onSelectPerson={(p) => setSelectedPerson(p)}
                />
              </div>

              {/* Specificity Scorecard */}
              <SpecificityScorecard drafts={drafts} onFixWeakLine={handleFixWeakLine} />
            </div>

            {/* Right Column: Generated Outreach Drafts */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Grounded Outreach Draft
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">
                      Subject: {drafts.email.subject}
                    </h3>
                  </div>
                  <button
                    onClick={() => copyDraft(drafts.email.body)}
                    className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy Email"}</span>
                  </button>
                </div>

                {/* Email Body */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans whitespace-pre-line leading-relaxed">
                  {drafts.email.body}
                </div>

                {/* Grounded Citations List */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="font-semibold text-slate-800 text-xs">
                    Grounded Citations (Proving Real Research):
                  </div>
                  <div className="space-y-1.5">
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

                {/* X DM & Follow-up previews */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-800">Twitter / X DM:</div>
                    <p className="text-slate-600 text-[11px]">{drafts.dm.body}</p>
                  </div>
                  <div className="p-3 bg-slate-50 border rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-800">Day 3 Follow-Up:</div>
                    <p className="text-slate-600 text-[11px]">{drafts.followUpDay3.body}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
