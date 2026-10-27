"use client";

import React, { useState } from "react";
import { PipelineItem } from "@/lib/types";
import { callGroqChat } from "@/lib/groq";
import { X, Check, Copy, ExternalLink, Sparkles, MessageSquare, Loader2, Send } from "lucide-react";

interface ReplyCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineItem?: PipelineItem | null;
  item?: PipelineItem | null;
}

export function ReplyCoachModal({
  isOpen,
  onClose,
  pipelineItem,
  item,
}: ReplyCoachModalProps) {
  const currentItem = pipelineItem || item;
  const [founderText, setFounderText] = useState(currentItem?.replyText || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedReply, setSuggestedReply] = useState(
    "Hi! Thanks so much for reaching out. Thursday at 3pm PT works great for a 15-minute sync. Looking forward to chatting!"
  );
  const [keyPoints, setKeyPoints] = useState<string[]>([
    "Lock in the calendar invite immediately",
    "Prepare a 2-minute walkthrough of the relevant project",
    "Keep reply under 3 sentences to maintain momentum",
  ]);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !currentItem) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(suggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnalyzeFounderReply = async () => {
    if (!founderText.trim()) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyBrief: currentItem.brief,
          targetPerson: currentItem.person,
          voiceInstruction: `Founder replied: "${founderText}". Write an optimal, high-agency response to lock in the interview or next step without being pushy.`,
          userProfile: {
            name: "Anurag",
            degreeOrStatus: "Builder",
            projects: [],
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.drafts?.email?.body) {
        setSuggestedReply(data.drafts.email.body);
        setKeyPoints([
          "Acknowledge their exact question directly",
          "Offer two concrete time slots with timezone",
          "Reiterate excitement for the product roadmap",
        ]);
      }
    } catch {
      // Continue
    } finally {
      setIsAnalyzing(false);
    }
  };

  const recipientEmail = currentItem.person?.email || "";
  const emailSubject = `Re: ${currentItem.drafts?.email?.subject || "Outreach"}`;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    recipientEmail
  )}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(suggestedReply)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Reply Coach — {currentItem.companyName}
              </h3>
              <p className="text-xs text-slate-500">
                Contact: {currentItem.person?.name} ({currentItem.person?.role})
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
        <div className="p-6 space-y-4 text-xs overflow-y-auto">
          {/* Founder's Incoming Note */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>What did the founder or recruiter say?</span>
            </label>
            <textarea
              rows={3}
              value={founderText}
              onChange={(e) => setFounderText(e.target.value)}
              placeholder='e.g. "Hey! Loved the project. Would you be free for a 15-min chat this Thursday at 3pm PT?"'
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
            <div className="flex justify-end">
              <button
                onClick={handleAnalyzeFounderReply}
                disabled={isAnalyzing || !founderText.trim()}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
              >
                {isAnalyzing && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Coach My Next Reply</span>
              </button>
            </div>
          </div>

          {/* Strategy Checklist */}
          <div className="p-3 bg-slate-50 border rounded-xl space-y-1.5">
            <div className="font-semibold text-slate-700">Coach Strategy:</div>
            <ul className="space-y-1 text-slate-600">
              {keyPoints.map((pt, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[9px]">
                    ✓
                  </span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Reply Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Recommended Reply:</span>
              <button
                onClick={handleCopy}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 whitespace-pre-line leading-relaxed">
              {suggestedReply}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold text-xs"
          >
            Close
          </button>

          <a
            href={gmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Open in Gmail</span>
          </a>
        </div>
      </div>
    </div>
  );
}
