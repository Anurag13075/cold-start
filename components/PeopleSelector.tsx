"use client";

import React from "react";
import { CompanyPerson, EmailReliability } from "@/lib/types";
import { User, Sparkles, Mail, ExternalLink, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";

interface PeopleSelectorProps {
  people: CompanyPerson[];
  selectedPersonId: string;
  onSelectPerson: (person: CompanyPerson) => void;
}

export function PeopleSelector({
  people,
  selectedPersonId,
  onSelectPerson,
}: PeopleSelectorProps) {
  if (!people || people.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
        No specific team members identified from public pages yet.
      </div>
    );
  }

  const getReliabilityBadge = (reliability: EmailReliability) => {
    switch (reliability) {
      case "Found on their site":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Found on site
          </span>
        );
      case "From public GitHub":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <CheckCircle className="w-3 h-3 text-purple-600" />
            From public GitHub
          </span>
        );
      case "Guess (unverified)":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <HelpCircle className="w-3 h-3 text-amber-500" />
            Guess (unverified)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
            <ShieldAlert className="w-3 h-3 text-slate-400" />
            No direct email
          </span>
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
        <span>Target Recipient</span>
        <span className="text-[11px] text-slate-400">{people.length} found</span>
      </div>

      <div className="space-y-2">
        {people.map((person) => {
          const isSelected = person.id === selectedPersonId;

          return (
            <div
              key={person.id}
              onClick={() => onSelectPerson(person)}
              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {person.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>{person.name}</span>
                      {person.isRecommended && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[9px] uppercase tracking-wider">
                          <Sparkles className="w-2.5 h-2.5" />
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 text-[11px]">{person.role}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {person.xUrl && (
                    <a
                      href={person.xUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                      title="View X profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {person.githubUrl && (
                    <a
                      href={person.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                      title="View GitHub profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Email & Reliability */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1 text-slate-700 font-mono">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{person.email || "No email"}</span>
                </div>
                <div>{getReliabilityBadge(person.emailReliability)}</div>
              </div>

              {/* Fallback if unverified or no email */}
              {person.fallbackContact && person.fallbackContact !== person.email && (
                <div className="mt-1.5 text-[10px] text-slate-500">
                  Fallback contact:{" "}
                  <span className="font-semibold text-slate-700">
                    {person.fallbackContact}
                  </span>
                </div>
              )}

              {/* Recommendation reason */}
              {person.recommendationReason && (
                <div className="mt-1.5 text-[10px] text-blue-700 bg-blue-50/60 rounded px-2 py-1">
                  <strong>Why them:</strong> {person.recommendationReason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
