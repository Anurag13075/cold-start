"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { UserProfile, ProjectItem } from "@/lib/types";
import { getStoredProfile } from "@/lib/storage";
import { Logo } from "@/components/Logo";
import { ExternalLink, Github, Mail, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export default function PitchPage() {
  const params = useParams();
  const rawId = (params?.companyId as string) || "Company";
  const companyName = decodeURIComponent(rawId).replace(/\.[a-z]+$/, "").replace(/^www\./, "");
  const formattedCompany = companyName.charAt(0).toUpperCase() + companyName.slice(1);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [viewCount, setViewCount] = useState<number>(1);

  useEffect(() => {
    const prof = getStoredProfile();
    setProfile(prof);

    // Track views in localStorage
    const storageKey = `pitch_view_count_${rawId}`;
    const existing = parseInt(localStorage.getItem(storageKey) || "0", 10);
    const updated = existing + 1;
    localStorage.setItem(storageKey, String(updated));
    setViewCount(updated);
  }, [rawId]);

  if (!profile) return null;

  // Pick top 2 showcase projects
  const showcaseProjects = (profile.projects || []).slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Pitch Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-slate-600 text-sm">/</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            Dedicated Brief for {formattedCompany}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>View #{viewCount}</span>
        </div>
      </header>

      {/* Main Pitch Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-12">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Portfolio &amp; Technical Proof</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Hi {formattedCompany} team, I built this for you.
          </h1>

          <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
            I&apos;m <span className="text-white font-semibold">{profile.name}</span>, a{" "}
            <span className="text-white">{profile.degreeOrStatus}</span>. Rather than sending a generic resume, here are the 2 systems I built that solve identical technical challenges to {formattedCompany}&apos;s roadmap.
          </p>
        </div>

        {/* Featured Projects with Screenshots */}
        <div className="space-y-8">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Relevant Architectures &amp; Live Proof
          </div>

          <div className="grid grid-cols-1 gap-8">
            {showcaseProjects.map((project, idx) => (
              <div
                key={project.id || idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors shadow-xl"
              >
                {/* Project Screenshots Carousel / Preview */}
                {project.images && project.images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-950 border-b border-slate-800">
                    {project.images.slice(0, 2).map((img, i) => (
                      <div key={i} className="aspect-video rounded-lg overflow-hidden border border-slate-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img}
                          alt={`${project.name} screenshot`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Project Details */}
                <div className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-bold text-white">{project.name}</h3>
                      <p className="text-slate-400 text-sm mt-1">{project.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
                        >
                          <span>Live App</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>Code</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Quantitative Result Badge */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Result:</strong> {project.result}
                    </span>
                  </div>

                  {/* Tech stack badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.tech.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Founder CTA & Note */}
        <div className="p-8 bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border border-blue-500/30 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold text-white">
            Want to see a 2-minute video walkthrough?
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            I recorded a short Loom walking through the exact state sync and offline edge cases I resolved in these builds. I&apos;d love to share it with your team.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={`mailto:${profile.portfolioUrl ? profile.name.toLowerCase() + "@example.com" : "anurag@example.com"}?subject=${encodeURIComponent(`Walkthrough for ${formattedCompany}`)}`}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Request Loom Walkthrough</span>
            </a>

            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
              >
                Portfolio
              </a>
            )}
            {profile.githubUsername && (
              <a
                href={`https://github.com/${profile.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <Github className="w-3.5 h-3.5" />
                <span>github.com/{profile.githubUsername}</span>
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        Generated with Cold Start • Voice-powered cold outreach for high-agency builders
      </footer>
    </div>
  );
}
