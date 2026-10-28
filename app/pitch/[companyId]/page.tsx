"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { UserProfile, ProjectItem, PipelineItem } from "@/lib/types";
import { getStoredProfile, getStoredPipeline } from "@/lib/storage";
import { Logo } from "@/components/Logo";
import {
  ExternalLink,
  Github,
  Mail,
  Copy,
  Check,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
  Code2,
  Terminal,
  Cpu,
  Layers,
  GitBranch,
  Eye,
  Share2,
  Bookmark,
  Activity,
  Send,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  FileText,
  User,
  Zap,
} from "lucide-react";

export default function PitchPage() {
  const params = useParams();
  const rawId = (params?.companyId as string) || "Company";
  const domainClean = decodeURIComponent(rawId).replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  const companyClean = domainClean.replace(/\.[a-z]+.*$/i, "");
  const formattedCompany = companyClean.charAt(0).toUpperCase() + companyClean.slice(1);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pipelineItem, setPipelineItem] = useState<PipelineItem | null>(null);
  const [viewCount, setViewCount] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [activeFilter, setActiveFilter] = useState<"all" | "flagship" | "live" | "opensource">("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const prof = getStoredProfile();
    setProfile(prof);

    // Look up company in stored pipeline for grounded context
    const pipeline = getStoredPipeline();
    const matched = pipeline.find(
      (p) =>
        p.companyDomain.toLowerCase().includes(domainClean.toLowerCase()) ||
        domainClean.toLowerCase().includes(p.companyDomain.toLowerCase())
    );
    if (matched) {
      setPipelineItem(matched);
    }

    // Track views in localStorage
    const storageKey = `pitch_view_count_${rawId}`;
    const existing = parseInt(localStorage.getItem(storageKey) || "0", 10);
    const updated = existing + 1;
    localStorage.setItem(storageKey, String(updated));
    setViewCount(updated);
  }, [rawId, domainClean]);

  // Extract unique tech tags from all projects
  const allTechTags = useMemo(() => {
    if (!profile?.projects) return [];
    const tags = new Set<string>();
    profile.projects.forEach((p) => p.tech?.forEach((t) => tags.add(t)));
    return Array.from(tags).slice(0, 12);
  }, [profile]);

  // Filter projects dynamically
  const filteredProjects = useMemo(() => {
    if (!profile?.projects) return [];
    return profile.projects.filter((p) => {
      if (activeFilter === "flagship" && !p.isShowcase) return false;
      if (activeFilter === "live" && !p.liveUrl) return false;
      if (activeFilter === "opensource" && !p.repoUrl) return false;
      if (selectedTag !== "All" && !p.tech?.includes(selectedTag)) return false;
      return true;
    });
  }, [profile, activeFilter, selectedTag]);

  const copyPageLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const copyEmailAddress = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center font-mono text-xs">
        Loading technical brief...
      </div>
    );
  }

  const userEmail =
    profile.portfolioUrl && profile.portfolioUrl.includes("@")
      ? profile.portfolioUrl
      : `${profile.name.toLowerCase().replace(/\s+/g, "")}@example.com`;

  const founderGreeting = pipelineItem?.person?.name
    ? `${pipelineItem.person.name} and the ${formattedCompany} Team`
    : `The ${formattedCompany} Engineering Team`;

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-zinc-700 selection:text-white font-sans antialiased">
      {/* Precision Top Grid Line Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Top Engineering Nav */}
      <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono text-xs text-white group-hover:border-zinc-700 transition-colors">
                CS
              </div>
              <span className="font-mono text-xs tracking-wider uppercase text-zinc-400 group-hover:text-zinc-200">
                PITCH_SPEC
              </span>
            </Link>

            <span className="text-zinc-700 font-mono text-xs">/</span>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800/90 text-xs font-mono">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-zinc-300 font-medium">{formattedCompany}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/60 border border-zinc-800/80 text-[11px] font-mono text-zinc-400">
              <Eye className="w-3 h-3 text-zinc-500" />
              <span>Verified View #{viewCount}</span>
            </div>

            <button
              onClick={copyPageLink}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
              <span>{copiedLink ? "Link Copied" : "Share"}</span>
            </button>

            <a
              href={`mailto:${userEmail}?subject=${encodeURIComponent(`Walkthrough for ${formattedCompany}`)}`}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Builder</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-16 space-y-14">
        {/* Hero Section: Design Engineer Memo */}
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>ARCHITECTURAL MEMO &bull; {domainClean}</span>
          </div>

          <div className="space-y-3">
            <div className="font-mono text-xs uppercase tracking-widest text-zinc-500">
              To: {founderGreeting}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Here is how my systems solve engineering problems for {formattedCompany}.
            </h1>
            <p className="text-base md:text-lg text-zinc-400 max-w-3xl leading-relaxed">
              I&apos;m <span className="text-zinc-200 font-semibold">{profile.name}</span>, a{" "}
              <span className="text-zinc-200">{profile.degreeOrStatus}</span> targeting roles in{" "}
              <span className="text-zinc-200 font-medium">{profile.targetRole || "Founding / Systems Engineering"}</span>. Rather than a static resume, this memo details the actual architectures, benchmarks, and production codebases I&apos;ve built that directly map to your challenges.
            </p>
          </div>

          {/* Social Proof & Social Pills Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            {profile.githubUsername && (
              <a
                href={`https://github.com/${profile.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-mono text-zinc-300 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>github.com/{profile.githubUsername}</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-500" />
              </a>
            )}

            {profile.xUrl && (
              <a
                href={profile.xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-mono text-zinc-300 transition-colors"
              >
                <span className="font-bold text-xs">𝕏</span>
                <span>Twitter / X</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-500" />
              </a>
            )}

            {profile.linkedInUrl && (
              <a
                href={profile.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-mono text-zinc-300 transition-colors"
              >
                <span className="font-bold text-xs">in</span>
                <span>LinkedIn</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-500" />
              </a>
            )}

            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-mono text-zinc-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Personal Site</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-500" />
              </a>
            )}

            <button
              onClick={() => copyEmailAddress(userEmail)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-mono text-zinc-300 transition-colors ml-auto"
            >
              {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmail ? "Email Copied" : userEmail}</span>
            </button>
          </div>
        </section>

        {/* Technical Vitals Metric Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-1">
            <div className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider flex items-center justify-between">
              <span>Codebases</span>
              <Code2 className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-white">
              {profile.projects?.length || 0}
            </div>
            <div className="text-[11px] text-zinc-400">Production &amp; OSS Builds</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-1">
            <div className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider flex items-center justify-between">
              <span>Primary Stack</span>
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-sm font-bold font-mono text-white truncate">
              {allTechTags.slice(0, 3).join(", ") || "TypeScript, CRDTs"}
            </div>
            <div className="text-[11px] text-zinc-400">High-concurrency systems</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-1">
            <div className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider flex items-center justify-between">
              <span>Target Role</span>
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-sm font-bold font-mono text-white truncate">
              {profile.targetRole || "Founding Engineer"}
            </div>
            <div className="text-[11px] text-zinc-400">High-agency startup fit</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-1">
            <div className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider flex items-center justify-between">
              <span>Memo Status</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold font-mono text-emerald-400">
              Active
            </div>
            <div className="text-[11px] text-zinc-400">Tracking verified opens</div>
          </div>
        </section>

        {/* Target Company Alignment Callout (If Scraped Data Exists) */}
        {pipelineItem?.brief && (
          <section className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Target Alignment Rationale &bull; {pipelineItem.brief.name}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">Live Crawl Context</span>
            </div>

            <div className="text-xs text-zinc-300 leading-relaxed">
              <strong>What {pipelineItem.brief.name} builds:</strong> {pipelineItem.brief.whatTheyMake}
            </div>

            {pipelineItem.drafts?.relevantProject && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono space-y-1">
                <div className="text-zinc-200">
                  <span className="text-blue-400 font-bold">&gt; Matched Project:</span>{" "}
                  {pipelineItem.drafts.relevantProject.name}
                </div>
                <div className="text-zinc-400 text-[11px]">
                  {pipelineItem.drafts.relevantProject.hook}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Featured Projects: Interactive Showcase (Showing ALL Projects!) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Production Codebases &amp; Proof</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                  {profile.projects?.length || 0} Total
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Real software built with measurable metrics, GitHub code, and live links.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-lg border border-zinc-800 text-xs font-mono">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeFilter === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                All ({profile.projects?.length || 0})
              </button>
              <button
                onClick={() => setActiveFilter("flagship")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeFilter === "flagship" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Flagship
              </button>
              <button
                onClick={() => setActiveFilter("live")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeFilter === "live" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Live Demos
              </button>
              <button
                onClick={() => setActiveFilter("opensource")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeFilter === "opensource" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                Open Source
              </button>
            </div>
          </div>

          {/* Tag Filter Pills */}
          {allTechTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
              <span className="text-zinc-500 mr-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3 h-3" /> Filter Stack:
              </span>
              <button
                onClick={() => setSelectedTag("All")}
                className={`px-2.5 py-0.5 rounded-md border transition-colors ${
                  selectedTag === "All"
                    ? "bg-white text-black border-white font-semibold"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                All
              </button>
              {allTechTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? "All" : tag)}
                  className={`px-2.5 py-0.5 rounded-md border transition-colors ${
                    selectedTag === tag
                      ? "bg-white text-black border-white font-semibold"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Projects Grid */}
          <div className="grid grid-cols-1 gap-6">
            {filteredProjects.map((project, idx) => (
              <div
                key={project.id || idx}
                className="group p-6 md:p-7 rounded-2xl bg-[#0e0e11] border border-zinc-800/90 hover:border-zinc-700 transition-all duration-200 shadow-xl space-y-5"
              >
                {/* Project Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                        {project.name}
                      </h3>
                      {project.isShowcase && (
                        <span className="px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-300 font-mono text-[10px] uppercase tracking-wider border border-zinc-700/80">
                          Flagship
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 font-mono text-[10px] border border-emerald-800/40">
                        Production Ready
                      </span>
                    </div>

                    <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                      {project.description}
                    </p>
                  </div>

                  {/* Direct Action Links */}
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <span>Live Demo</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {project.repoUrl && (
                      <a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>Source Code</span>
                        <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Quantitative Metric Callout */}
                {project.result && (
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-mono flex items-start gap-2.5">
                    <Terminal className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px] block">
                        Verified Metric / Benchmark:
                      </span>
                      <span className="text-zinc-200 font-medium">{project.result}</span>
                    </div>
                  </div>
                )}

                {/* Project Screenshots Gallery */}
                {project.images && project.images.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      Screenshots &amp; UI Previews ({project.images.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {project.images.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedImage(img)}
                          className="aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 cursor-pointer group/img relative hover:border-zinc-600 transition-colors"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`${project.name} preview ${i + 1}`}
                            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-xs font-mono text-white">
                            View Fullscreen
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tech Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/80">
                  <span className="text-zinc-500 font-mono text-[11px] mr-1">Stack:</span>
                  {project.tech.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-mono hover:border-zinc-700 transition-colors"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Stack Matrix */}
        <section className="p-6 md:p-8 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <span>Full Technical Competencies</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Languages, runtimes, and engineering tooling utilized across these builds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <div className="font-mono text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Languages</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["TypeScript", "JavaScript", "Python", "Rust", "Go", "SQL", "HTML/CSS"].map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-mono">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <div className="font-mono text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                <span>Frontend &amp; Frameworks</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["React 18", "Next.js (App Router)", "TailwindCSS", "Node.js", "Chrome Extensions", "Web Audio API", "Web Speech"].map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-mono">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <div className="font-mono text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
                <span>Systems &amp; Storage</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["CRDTs & Local-First", "IndexedDB", "PostgreSQL", "Edge Replication", "Docker", "Git Workflows", "Vercel / Cloudflare"].map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-mono">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Resume & Background Timeline (If Present) */}
        {profile.resume && (
          <section className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>Verified Education &amp; Background</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Extracted directly from verified credentials.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
              {profile.resume.education?.length > 0 && (
                <div className="space-y-1">
                  <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
                    Education &bull; Degree
                  </div>
                  <div className="text-sm font-semibold text-zinc-200">
                    {profile.resume.education.join(" • ")}
                  </div>
                </div>
              )}

              {profile.resume.experience?.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                  <div className="font-mono text-xs text-zinc-500 uppercase tracking-wider">
                    Past Experience
                  </div>
                  <div className="space-y-3">
                    {profile.resume.experience.map((exp, idx) => (
                      <div key={idx} className="text-xs space-y-1">
                        <div className="font-bold text-white flex items-center justify-between">
                          <span>{exp.role} @ {exp.company}</span>
                          <span className="font-mono text-zinc-500 text-[11px]">{exp.period}</span>
                        </div>
                        <ul className="list-disc list-inside text-zinc-400 text-[11px] space-y-0.5">
                          {exp.bullets?.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 2-Minute Architectural Loom Request Box */}
        <section className="p-8 rounded-2xl bg-gradient-to-b from-[#141418] to-[#0c0c0f] border border-zinc-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/50 font-mono text-[10px] text-blue-400 uppercase tracking-wider">
                Video Walkthrough Ready
              </span>
              <h3 className="text-xl font-bold text-white">
                Want a 2-minute architectural Loom walkthrough?
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                I recorded a short video detailing the offline conflict-resolution algorithms, state sync edge cases, and performance optimizations implemented across these systems.
              </p>
            </div>

            <a
              href={`mailto:${userEmail}?subject=${encodeURIComponent(`Send Loom Walkthrough for ${formattedCompany}`)}`}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs font-mono transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Request Loom Walkthrough</span>
            </a>
          </div>
        </section>
      </main>

      {/* Screenshot Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] rounded-xl overflow-hidden border border-zinc-800 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt="Fullscreen preview" className="w-full h-auto object-contain" />
          </div>
        </div>
      )}

      {/* Crafted Minimalist Footer */}
      <footer className="border-t border-zinc-900 py-8 px-6 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            Built with <span className="text-zinc-300 font-semibold">Cold Start</span> &bull; Engineering Memos for High-Agency Teams
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <Link href="/app" className="hover:text-white transition-colors">
              Workspace
            </Link>
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
