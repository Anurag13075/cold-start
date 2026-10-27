"use client";

import React from "react";
import { PipelineItem } from "@/lib/types";
import { X, BarChart3, TrendingUp, MailCheck, AlertCircle, Sparkles } from "lucide-react";

interface RealStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipeline: PipelineItem[];
}

export function RealStatsModal({ isOpen, onClose, pipeline }: RealStatsModalProps) {
  if (!isOpen) return null;

  // Filter items that were actually sent
  const sentItems = pipeline.filter(
    (item) => item.sentAt || ["Sent", "Follow-up due", "Replied", "Interview", "Closed"].includes(item.status)
  );

  const sentCount = sentItems.length;
  const repliedItems = sentItems.filter((item) =>
    ["Replied", "Interview", "Closed"].includes(item.status)
  );
  const replyCount = repliedItems.length;

  const replyRate = sentCount > 0 ? Math.round((replyCount / sentCount) * 100) : 0;

  // Group successful subject lines
  const successfulSubjects = repliedItems.map((item) => item.drafts?.email?.subject).filter(Boolean);

  // Group which projects got replies
  const projectInterest: Record<string, number> = {};
  repliedItems.forEach((item) => {
    const proj = item.drafts?.relevantProject?.name;
    if (proj) {
      projectInterest[proj] = (projectInterest[proj] || 0) + 1;
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Outreach Performance</h3>
              <p className="text-xs text-slate-500">
                Calculated strictly from your verified sent emails
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {sentCount < 5 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-200/80 text-slate-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Not enough data yet</h4>
                <p className="text-slate-500 text-xs mt-1">
                  You have sent {sentCount} of 5 required emails to calculate real statistical reply rates. Cold Start does not display fake or simulated charts.
                </p>
              </div>

              {/* Progress bar to 5 emails */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (sentCount / 5) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {sentCount} / 5 sent
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stat Highlights */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-xl font-extrabold text-slate-900">{sentCount}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Sent</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-xl font-extrabold text-emerald-600">{replyCount}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Replies</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <div className="text-xl font-extrabold text-blue-600">{replyRate}%</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Reply Rate</div>
                </div>
              </div>

              {/* Top Performing Subjects */}
              <div className="space-y-2">
                <div className="font-semibold text-slate-700">Subject lines that generated replies:</div>
                {successfulSubjects.length === 0 ? (
                  <div className="text-slate-400 text-xs italic">Awaiting first reply.</div>
                ) : (
                  successfulSubjects.map((sub, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-emerald-950 font-medium text-[11px] flex items-center gap-1.5"
                    >
                      <MailCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>&ldquo;{sub}&rdquo;</span>
                    </div>
                  ))
                )}
              </div>

              {/* Project interest */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="font-semibold text-slate-700">Which of your projects resonated most:</div>
                {Object.keys(projectInterest).length === 0 ? (
                  <div className="text-slate-400 text-xs italic">Awaiting reply attribution.</div>
                ) : (
                  Object.entries(projectInterest).map(([proj, count], i) => (
                    <div
                      key={i}
                      className="p-2 bg-slate-50 border rounded-lg flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-800">{proj}</span>
                      <span className="text-blue-600 font-semibold">{count} reply(s)</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
