"use client";

import React from "react";
import { GeneratedDrafts } from "@/lib/types";
import { ShieldCheck, AlertTriangle, CheckCircle2, Wand2 } from "lucide-react";

interface SpecificityScorecardProps {
  drafts: GeneratedDrafts;
  onFixWeakLine: (oldLine: string, newLine: string) => void;
}

export function SpecificityScorecard({ drafts, onFixWeakLine }: SpecificityScorecardProps) {
  const { specificityScore, checks, weakLines } = drafts;

  const scoreColor =
    specificityScore >= 90
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : specificityScore >= 80
      ? "text-blue-600 bg-blue-50 border-blue-200"
      : "text-amber-600 bg-amber-50 border-amber-200";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      {/* Header and score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-700" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Cold Start Specificity Score
          </h4>
        </div>
        <div
          className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${scoreColor}`}
        >
          <span>{specificityScore} / 100</span>
        </div>
      </div>

      {/* Rigorous checks checklist */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-700">
          <CheckCircle2
            className={`w-3.5 h-3.5 ${
              checks.namesRealDetail ? "text-emerald-500" : "text-slate-300"
            }`}
          />
          <span>Names real product detail</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <CheckCircle2
            className={`w-3.5 h-3.5 ${
              checks.matchesProject ? "text-emerald-500" : "text-slate-300"
            }`}
          />
          <span>Matches verified project</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <CheckCircle2
            className={`w-3.5 h-3.5 ${
              checks.under90Words ? "text-emerald-500" : "text-slate-300"
            }`}
          />
          <span>Strictly under 90 words</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700">
          <CheckCircle2
            className={`w-3.5 h-3.5 ${
              checks.clearAsk ? "text-emerald-500" : "text-slate-300"
            }`}
          />
          <span>Single zero-friction ask</span>
        </div>
      </div>

      {/* Matched project rationale */}
      {drafts.relevantProject && (
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs">
          <div className="font-semibold text-slate-800">
            Matched: {drafts.relevantProject.name}
          </div>
          <div className="text-slate-500 text-[11px] mt-0.5">
            {drafts.relevantProject.hook}
          </div>
        </div>
      )}

      {/* Weak line detection & 1-click fixer */}
      {weakLines && weakLines.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Generic phrasing detected ({weakLines.length})</span>
          </div>

          <div className="space-y-2">
            {weakLines.map((wl, i) => (
              <div
                key={i}
                className="bg-amber-50/70 border border-amber-200 rounded-lg p-2 text-xs space-y-1.5"
              >
                <div className="text-slate-700 line-through text-[11px] opacity-75">
                  &ldquo;{wl.line}&rdquo;
                </div>
                <div className="text-slate-500 text-[10px]">
                  <strong>Issue:</strong> {wl.issue}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-emerald-700 font-medium text-[11px]">
                    &ldquo;{wl.suggestion}&rdquo;
                  </span>
                  <button
                    onClick={() => onFixWeakLine(wl.line, wl.suggestion)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-semibold transition-colors shrink-0"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Apply Fix</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
