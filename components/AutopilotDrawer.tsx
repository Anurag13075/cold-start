"use client";

import React, { useState, useEffect } from "react";
import {
  AutopilotQueueItem,
  UserProfile,
  PipelineItem,
  DoNotContactItem,
} from "@/lib/types";
import {
  getStoredAutopilotQueue,
  saveStoredAutopilotQueue,
  getStoredDoNotContact,
  saveStoredDoNotContact,
  getStoredPipeline,
  saveStoredPipeline,
} from "@/lib/storage";
import {
  X,
  Play,
  Check,
  SkipForward,
  Edit3,
  AlertOctagon,
  Trash2,
  Calendar,
  Sparkles,
  Loader2,
  ListPlus,
  ShieldAlert,
} from "lucide-react";

interface AutopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSelectForEdit: (item: AutopilotQueueItem) => void;
  onPipelineUpdated: () => void;
}

export function AutopilotDrawer({
  isOpen,
  onClose,
  userProfile,
  onSelectForEdit,
  onPipelineUpdated,
}: AutopilotDrawerProps) {
  const [activeTab, setActiveTab] = useState<"queue" | "donotcontact">("queue");
  const [urlsInput, setUrlsInput] = useState("");
  const [queue, setQueue] = useState<AutopilotQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Do not contact state
  const [dncList, setDncList] = useState<DoNotContactItem[]>([]);
  const [newDncDomain, setNewDncDomain] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQueue(getStoredAutopilotQueue());
      setDncList(getStoredDoNotContact());
    }
  }, [isOpen]);

  // Keyboard shortcut listener for review: 'A' to Approve, 'S' to Skip, 'E' to Edit
  useEffect(() => {
    if (!isOpen || activeTab !== "queue") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a textarea or input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const currentItem = queue[currentIndex];
      if (!currentItem || currentItem.status !== "drafted") return;

      if (e.key === "a" || e.key === "A") {
        e.preventDefault();
        handleApprove(currentIndex);
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleSkip(currentIndex);
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        onSelectForEdit(currentItem);
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeTab, queue, currentIndex]);

  if (!isOpen) return null;

  // Add URLs to queue (Max 20)
  const handleEnqueueUrls = () => {
    const rawLines = urlsInput
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter(Boolean);

    if (rawLines.length === 0) return;

    const pipeline = getStoredPipeline();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const newItems: AutopilotQueueItem[] = [];

    for (const raw of rawLines.slice(0, 20)) {
      let clean = raw.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
      if (!clean) continue;

      // Check Do-Not-Contact list
      const isBlocked = dncList.some((dnc) => clean.includes(dnc.domainOrEmail.toLowerCase()));
      if (isBlocked) continue;

      // Check 30-day anti-repeat rule
      const recentlyMessaged = pipeline.some((p) => {
        if (!p.companyDomain.toLowerCase().includes(clean)) return false;
        if (!p.sentAt) return false;
        return new Date(p.sentAt).getTime() > thirtyDaysAgo;
      });
      if (recentlyMessaged) continue;

      newItems.push({
        id: `auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        url: raw.startsWith("http") ? raw : `https://${raw}`,
        domain: clean,
        status: "queued",
        progressMsg: "Waiting in queue...",
      });
    }

    const updated = [...queue, ...newItems];
    setQueue(updated);
    saveStoredAutopilotQueue(updated);
    setUrlsInput("");
  };

  // Run batch research sequentially
  const runBatchProcessing = async () => {
    setIsProcessing(true);
    const updated = [...queue];

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status !== "queued") continue;

      updated[i].status = "researching";
      updated[i].progressMsg = "Reading pages & changelog...";
      setQueue([...updated]);

      try {
        // Step 1: Research
        const resScrape = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: updated[i].url }),
        });
        const researchData = await resScrape.json();

        if (!resScrape.ok || !researchData.brief) {
          throw new Error(researchData.error || "Failed to research site");
        }

        updated[i].companyBrief = researchData.brief;
        updated[i].people = researchData.people;
        const targetPerson = researchData.people?.find((p: any) => p.isRecommended) || researchData.people?.[0];
        updated[i].selectedPerson = targetPerson;

        // Step 2: Draft
        updated[i].progressMsg = "Drafting personalized outreach...";
        setQueue([...updated]);

        const resDraft = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyBrief: researchData.brief,
            targetPerson,
            userProfile,
          }),
        });
        const draftData = await resDraft.json();

        if (!resDraft.ok || !draftData.drafts) {
          throw new Error(draftData.error || "Failed to generate draft");
        }

        updated[i].drafts = draftData.drafts;
        updated[i].status = "drafted";
        updated[i].progressMsg = "Ready for review";
      } catch (err: any) {
        updated[i].status = "failed";
        updated[i].error = err.message || "Failed";
      }

      setQueue([...updated]);
      saveStoredAutopilotQueue(updated);
    }

    setIsProcessing(false);
  };

  // Safe Spacing Schedule (Max 15 per day)
  const calculateNextScheduleDate = (existingCount: number): string => {
    const today = new Date();
    const dayOffset = Math.floor(existingCount / 15);
    const scheduled = new Date(today.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    return scheduled.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleApprove = (index: number) => {
    const updated = [...queue];
    const item = updated[index];
    if (!item || !item.drafts || !item.companyBrief) return;

    const pipeline = getStoredPipeline();
    const scheduledDate = calculateNextScheduleDate(pipeline.filter((p) => p.status === "Approved").length);

    item.status = "approved";
    item.approvedScheduledDate = scheduledDate;

    // Add to pipeline
    const pipelineItem: PipelineItem = {
      id: item.id,
      companyDomain: item.domain,
      companyName: item.companyBrief.name,
      companyUrl: item.url,
      person: item.selectedPerson || {
        id: "p1",
        name: "Founder",
        role: "Team",
        emailReliability: "Guess (unverified)",
        isRecommended: true,
      },
      status: "Approved",
      createdAt: new Date().toISOString(),
      drafts: item.drafts,
      brief: item.companyBrief,
    };

    const newPipeline = [pipelineItem, ...pipeline];
    saveStoredPipeline(newPipeline);
    saveStoredAutopilotQueue(updated);
    setQueue(updated);
    onPipelineUpdated();

    // Advance to next
    if (currentIndex < updated.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSkip = (index: number) => {
    const updated = [...queue];
    updated[index].status = "skipped";
    saveStoredAutopilotQueue(updated);
    setQueue(updated);
    if (currentIndex < updated.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleClearQueue = () => {
    setQueue([]);
    saveStoredAutopilotQueue([]);
  };

  // Do Not Contact Handlers
  const handleAddDnc = () => {
    if (!newDncDomain.trim()) return;
    const clean = newDncDomain.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").trim();
    const updated = [
      ...dncList,
      { domainOrEmail: clean, addedAt: new Date().toISOString() },
    ];
    setDncList(updated);
    saveStoredDoNotContact(updated);
    setNewDncDomain("");
  };

  const handleRemoveDnc = (domain: string) => {
    const updated = dncList.filter((d) => d.domainOrEmail !== domain);
    setDncList(updated);
    saveStoredDoNotContact(updated);
  };

  const currentItem = queue[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Autopilot Mode</h3>
              <p className="text-xs text-slate-500">
                Batch research, auto-drafting &amp; 1-touch keyboard review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab("queue")}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === "queue"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Review Queue ({queue.filter((q) => q.status === "drafted").length} ready)
          </button>
          <button
            onClick={() => setActiveTab("donotcontact")}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === "donotcontact"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Do-Not-Contact List ({dncList.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === "queue" && (
            <>
              {/* Batch Input Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-semibold text-slate-800">
                  Paste up to 20 company URLs (one per line):
                </div>
                <textarea
                  rows={3}
                  value={urlsInput}
                  onChange={(e) => setUrlsInput(e.target.value)}
                  placeholder="linear.app&#10;supabase.com&#10;resend.com"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Safe spacing limit: 15 sends/day max
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEnqueueUrls}
                      disabled={!urlsInput.trim()}
                      className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-black transition-colors"
                    >
                      Enqueue URLs
                    </button>
                    <button
                      onClick={runBatchProcessing}
                      disabled={isProcessing || !queue.some((q) => q.status === "queued")}
                      className="px-4 py-1.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Researching...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Autopilot</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Keyboard helper banner */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 flex items-center justify-between text-[11px] text-purple-900">
                <span className="font-medium">
                  Keyboard Review Controls:
                </span>
                <div className="flex items-center gap-3">
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono font-bold">A</kbd> Approve
                  </span>
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono font-bold">E</kbd> Edit
                  </span>
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-white border rounded font-mono font-bold">S</kbd> Skip
                  </span>
                </div>
              </div>

              {/* Current Active Item Review Card */}
              {currentItem && currentItem.status === "drafted" && currentItem.drafts ? (
                <div className="p-4 bg-white border-2 border-purple-500 rounded-xl space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">
                        Reviewing {currentIndex + 1} of {queue.length}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {currentItem.companyBrief?.name} ({currentItem.domain})
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Score: {currentItem.drafts.specificityScore}/100
                    </span>
                  </div>

                  <div className="text-xs text-slate-600">
                    <strong>Recipient:</strong> {currentItem.selectedPerson?.name} (
                    {currentItem.selectedPerson?.role}) •{" "}
                    <span className="font-mono text-[11px]">
                      {currentItem.selectedPerson?.email}
                    </span>
                  </div>

                  {/* Draft preview */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                    <div className="font-bold text-slate-800">
                      Subject: {currentItem.drafts.email.subject}
                    </div>
                    <p className="whitespace-pre-line text-slate-700 text-[11px]">
                      {currentItem.drafts.email.body}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => handleSkip(currentIndex)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 flex items-center gap-1"
                    >
                      <SkipForward className="w-3.5 h-3.5" /> Skip [S]
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelectForEdit(currentItem);
                          onClose();
                        }}
                        className="px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit [E]
                      </button>

                      <button
                        onClick={() => handleApprove(currentIndex)}
                        className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve [A]
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Queue List Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>All Queue Items ({queue.length}):</span>
                  {queue.length > 0 && (
                    <button
                      onClick={handleClearQueue}
                      className="text-slate-400 hover:text-red-600 text-[11px]"
                    >
                      Clear queue
                    </button>
                  )}
                </div>

                {queue.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-xl text-slate-400">
                    Queue is empty. Paste company URLs above to run batch outreach!
                  </div>
                ) : (
                  queue.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        idx === currentIndex
                          ? "border-purple-500 bg-purple-50/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 text-[11px]">#{idx + 1}</span>
                        <div>
                          <div className="font-semibold text-slate-900">{item.domain}</div>
                          <div className="text-[11px] text-slate-500">{item.progressMsg}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === "approved" && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Scheduled: {item.approvedScheduledDate}
                          </span>
                        )}
                        {item.status === "skipped" && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                            Skipped
                          </span>
                        )}
                        {item.status === "researching" && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Crawling
                          </span>
                        )}
                        {item.status === "drafted" && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded font-bold text-[10px]">
                            Ready to Review
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* TAB 2: DO NOT CONTACT */}
          {activeTab === "donotcontact" && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Anti-Spam Protection:</strong> Domains or emails added here will be automatically blocked from drafting or sending. Cold Start also automatically enforces a 30-day anti-repeat rule for any company already messaged.
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDncDomain}
                  onChange={(e) => setNewDncDomain(e.target.value)}
                  placeholder="e.g. competitor.com or founder@domain.com"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
                <button
                  onClick={handleAddDnc}
                  disabled={!newDncDomain.trim()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-black transition-colors"
                >
                  Block Contact
                </button>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-700 text-xs">
                  Blocked Domains &amp; Contacts ({dncList.length}):
                </div>
                {dncList.length === 0 ? (
                  <div className="p-6 text-center border border-dashed rounded-xl text-slate-400">
                    No blocked contacts.
                  </div>
                ) : (
                  dncList.map((dnc, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-slate-800">{dnc.domainOrEmail}</span>
                      <button
                        onClick={() => handleRemoveDnc(dnc.domainOrEmail)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
