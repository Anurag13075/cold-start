"use client";

import React, { useState } from "react";
import { PipelineItem } from "@/lib/types";
import { X, Check, Copy, ExternalLink, Sparkles, MessageSquare } from "lucide-react";

interface ReplyCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PipelineItem | null;
}

export function ReplyCoachModal({ isOpen, onClose, item }: ReplyCoachModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !item) return null;

  const coach = item.replyCoachRecommendation || {
    summary: "Founder requested a 15-min chat.",
    suggestedReply:
      "Hi! Thanks so much for reaching out. Thursday at 3pm PT works great. Looking forward to chatting!",
    keyPoints: ["Lock in time", "Prepare 2 talking points", "Keep it concise"],
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(coach.suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
    `Re: ${item.lastSubject || "Quick chat"}`
  )}&body=${encodeURIComponent(coach.suggestedReply)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Reply Coach — {item.companyName}
              </h3>
              <p className="text-xs text-slate-500">
                Founder replied {item.timeAgo.toLowerCase()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          {/* Founder's Incoming Note */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Founder Message:
            </div>
            <p className="text-slate-800 text-xs leading-relaxed italic">
              "{item.replyText || "Hey Anurag, loved the demo! Would you be free for a 15-min chat this Thursday at 3pm PT?"}"
            </p>
          </div>

          {/* Key Strategy Points */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2">Coach Strategy:</div>
            <ul className="space-y-1.5">
              {coach.keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Reply Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Recommended Reply:</span>
              <button
                onClick={handleCopy}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy reply</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/20 text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {coach.suggestedReply}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Zero OAuth needed</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg"
            >
              Close
            </button>
            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
            >
              <span>Open in Gmail</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
