"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserProfile, CompanyBrief, RepoIssue, InterviewQuestion } from "@/lib/types";
import {
  X,
  Share2,
  GitPullRequest,
  FileText,
  Mic,
  MicOff,
  Volume2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  Printer,
  AlertCircle,
} from "lucide-react";

interface JobToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  companyBrief: CompanyBrief;
}

export function JobToolsModal({
  isOpen,
  onClose,
  userProfile,
  companyBrief,
}: JobToolsModalProps) {
  const [activeTab, setActiveTab] = useState<"pitch" | "reposcout" | "resume" | "interview">("pitch");

  // Pitch Page State
  const [copiedPitchLink, setCopiedPitchLink] = useState(false);

  // Repo Scout State
  const [repoIssues, setRepoIssues] = useState<RepoIssue[]>([]);
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);

  // Tailored Resume State
  const [tailoredResumeData, setTailoredResumeData] = useState<any>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(false);

  // Interview Prep & Voice Mock State
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [isRecordingAnswer, setIsRecordingAnswer] = useState(false);
  const [answerTranscript, setAnswerTranscript] = useState("");
  const [evalResult, setEvalResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      if (activeTab === "reposcout" && repoIssues.length === 0) {
        fetchRepoIssues();
      } else if (activeTab === "resume" && !tailoredResumeData) {
        fetchTailoredResume();
      } else if (activeTab === "interview" && questions.length === 0) {
        fetchInterviewPrep();
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const pitchUrl = typeof window !== "undefined"
    ? `${window.location.origin}/pitch/${encodeURIComponent(companyBrief.domain)}`
    : `/pitch/${companyBrief.domain}`;

  const copyPitchLink = () => {
    navigator.clipboard.writeText(pitchUrl);
    setCopiedPitchLink(true);
    setTimeout(() => setCopiedPitchLink(false), 2000);
  };

  // Fetch Repo Scout
  const fetchRepoIssues = async () => {
    setIsLoadingRepo(true);
    try {
      const res = await fetch("/api/repo-scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubUrl: companyBrief.githubUrl,
          companyDomain: companyBrief.domain,
          userSkills: userProfile.resume?.skills,
        }),
      });
      const data = await res.json();
      if (res.ok && data.issues) {
        setRepoIssues(data.issues);
      }
    } catch {
      // Continue
    } finally {
      setIsLoadingRepo(false);
    }
  };

  // Fetch Tailored Resume
  const fetchTailoredResume = async () => {
    setIsLoadingResume(true);
    try {
      const res = await fetch("/api/tailored-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userProfile, companyBrief }),
      });
      const data = await res.json();
      if (res.ok) {
        setTailoredResumeData(data);
      }
    } catch {
      // Continue
    } finally {
      setIsLoadingResume(false);
    }
  };

  const openPrintableResume = () => {
    if (!tailoredResumeData?.printableHtml) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(tailoredResumeData.printableHtml);
      printWindow.document.close();
    }
  };

  // Fetch Interview Prep
  const fetchInterviewPrep = async () => {
    setIsLoadingQuestions(true);
    try {
      const res = await fetch("/api/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userProfile, companyBrief }),
      });
      const data = await res.json();
      if (res.ok && data.questions) {
        setQuestions(data.questions);
      }
    } catch {
      // Continue
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Read Question Aloud via Browser TTS
  const speakQuestion = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeakingQuestion(true);
    utterance.onend = () => setIsSpeakingQuestion(false);
    utterance.onerror = () => setIsSpeakingQuestion(false);
    window.speechSynthesis.speak(utterance);
  };

  // Speak Answer via Web Speech API
  const startRecordingAnswer = () => {
    setIsRecordingAnswer(true);
    setAnswerTranscript("");
    setEvalResult(null);

    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (e: any) => {
        let finalTrans = "";
        for (let i = 0; i < e.results.length; i++) {
          finalTrans += e.results[i][0].transcript;
        }
        setAnswerTranscript(finalTrans);
      };

      rec.onerror = () => setIsRecordingAnswer(false);
      rec.onend = () => setIsRecordingAnswer(false);
      rec.start();
      recognitionRef.current = rec;
    }
  };

  const stopRecordingAnswer = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecordingAnswer(false);
  };

  // Evaluate Answer via Groq
  const evaluateAnswer = async () => {
    const q = questions[activeQuestionIdx];
    if (!q || !answerTranscript.trim()) return;

    setIsEvaluating(true);
    try {
      const res = await fetch("/api/mock-interview-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question,
          context: q.context,
          idealKeyPoints: q.idealKeyPoints,
          transcript: answerTranscript,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvalResult(data);
      }
    } catch {
      // Continue
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              🚀
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Outreach Superchargers • {companyBrief.name}
              </h3>
              <p className="text-xs text-slate-500">
                Tools that give you an unfair advantage over other candidates
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-6 text-xs font-semibold shrink-0 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("pitch")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "pitch"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Company Pitch Page</span>
          </button>

          <button
            onClick={() => setActiveTab("reposcout")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "reposcout"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Repo Scout</span>
          </button>

          <button
            onClick={() => setActiveTab("resume")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "resume"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Tailored Resume (PDF)</span>
          </button>

          <button
            onClick={() => setActiveTab("interview")}
            className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "interview"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Mock Interview</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* TAB 1: PITCH PAGE */}
          {activeTab === "pitch" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Private Web Pitch Page</span>
                </div>
                <p className="text-blue-800 text-xs">
                  A personalized, standalone web page built exclusively for {companyBrief.name}.
                  It showcases your 2 best-matching projects with your uploaded screenshots, GitHub links, and a personal note.
                  When the founder opens the link, you receive real view confirmation.
                </p>
              </div>

              <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-white">
                <div className="font-semibold text-slate-700">Shareable Pitch Link:</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pitchUrl}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                  />
                  <button
                    onClick={copyPitchLink}
                    className="px-3.5 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-black transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copiedPitchLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPitchLink ? "Copied" : "Copy Link"}</span>
                  </button>
                  <a
                    href={pitchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1 shrink-0"
                  >
                    <span>Preview Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>View tracking active • Page automatically renders your uploaded project screenshots</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REPO SCOUT */}
          {activeTab === "reposcout" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Repo Scout: Open Issues</h4>
                  <p className="text-slate-500 text-xs">
                    Citing an open PR or introductory issue in your outreach demonstrates high agency and doubles reply rates.
                  </p>
                </div>
                <button
                  onClick={fetchRepoIssues}
                  disabled={isLoadingRepo}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1"
                >
                  {isLoadingRepo && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Refresh Issues</span>
                </button>
              </div>

              {isLoadingRepo ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  <span>Searching open source repositories...</span>
                </div>
              ) : repoIssues.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-xl text-slate-400 space-y-2">
                  <div>No open &quot;good first issue&quot; or &quot;help wanted&quot; issues found for this organization.</div>
                  {companyBrief.githubUrl && (
                    <a
                      href={companyBrief.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-xs inline-flex items-center gap-1"
                    >
                      Visit GitHub Organization <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {repoIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{issue.title}</span>
                          <span className="font-mono text-slate-400">#{issue.number}</span>
                        </div>
                        <a
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 shrink-0 p-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <div className="text-slate-600 text-[11px]">{issue.matchReason}</div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {issue.labels.map((lbl, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold"
                          >
                            {lbl}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TAILORED RESUME */}
          {activeTab === "resume" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">
                    Tailored Resume for {companyBrief.name}
                  </h4>
                  <p className="text-slate-500 text-xs">
                    Reorders your projects and skills so what matches {companyBrief.name}&apos;s stack appears first.
                  </p>
                </div>

                <button
                  onClick={openPrintableResume}
                  disabled={!tailoredResumeData}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save 1-Page PDF</span>
                </button>
              </div>

              {isLoadingResume ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  <span>Tailoring resume layout with Groq...</span>
                </div>
              ) : tailoredResumeData ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div>
                    <span className="font-semibold text-slate-700">Target Match Rationale:</span>
                    <p className="text-slate-600 text-xs mt-0.5">
                      {tailoredResumeData.tailoredSummary}
                    </p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700">Prioritized Technical Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {tailoredResumeData.prioritizedSkills?.map((s: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[11px] font-semibold"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-700">Prioritized Projects:</span>
                    <div className="space-y-2 mt-2">
                      {tailoredResumeData.tailoredProjects?.map((p: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-white border rounded-lg text-xs">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <ul className="list-disc list-inside text-slate-600 text-[11px] mt-1 space-y-0.5">
                            {p.bullets?.map((b: string, i: number) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400">
                  Click refresh to tailor your resume.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INTERVIEW PREP & VOICE MOCK INTERVIEW */}
          {activeTab === "interview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">
                    Voice Mock Interview for {companyBrief.name}
                  </h4>
                  <p className="text-slate-500 text-xs">
                    Listen to company-tailored questions, speak your answer, and receive live clarity and filler-word scoring.
                  </p>
                </div>
                <button
                  onClick={fetchInterviewPrep}
                  disabled={isLoadingQuestions}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Regenerate
                </button>
              </div>

              {isLoadingQuestions ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  <span>Generating company-specific questions...</span>
                </div>
              ) : questions.length > 0 ? (
                <div className="space-y-4">
                  {/* Question selector tabs */}
                  <div className="flex gap-2">
                    {questions.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setActiveQuestionIdx(i);
                          setAnswerTranscript("");
                          setEvalResult(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                          activeQuestionIdx === i
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Q{i + 1}
                      </button>
                    ))}
                  </div>

                  {/* Active Question Card */}
                  {questions[activeQuestionIdx] && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                            Interview Question #{activeQuestionIdx + 1}
                          </span>
                          <h5 className="font-bold text-slate-900 text-sm mt-0.5">
                            {questions[activeQuestionIdx].question}
                          </h5>
                          <p className="text-slate-500 text-[11px] mt-1">
                            <strong>Why they ask:</strong> {questions[activeQuestionIdx].context}
                          </p>
                        </div>

                        {/* Text to Speech Read Button */}
                        <button
                          onClick={() => speakQuestion(questions[activeQuestionIdx].question)}
                          className={`p-2 rounded-lg border transition-colors shrink-0 ${
                            isSpeakingQuestion
                              ? "bg-blue-600 text-white border-blue-600 animate-pulse"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                          title="Read question out loud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Ideal points to touch */}
                      <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                        <div className="font-semibold text-slate-700 text-[11px] mb-1">
                          Key points to cover:
                        </div>
                        <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                          {questions[activeQuestionIdx].idealKeyPoints?.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Voice Recording Workspace */}
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-700 text-xs">
                            Your Spoken Answer:
                          </span>
                          {isRecordingAnswer ? (
                            <button
                              onClick={stopRecordingAnswer}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-xs animate-pulse"
                            >
                              <MicOff className="w-3.5 h-3.5" />
                              <span>Stop Recording</span>
                            </button>
                          ) : (
                            <button
                              onClick={startRecordingAnswer}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                            >
                              <Mic className="w-3.5 h-3.5" />
                              <span>Speak Answer (Wispr / Mic)</span>
                            </button>
                          )}
                        </div>

                        <textarea
                          rows={3}
                          value={answerTranscript}
                          onChange={(e) => setAnswerTranscript(e.target.value)}
                          placeholder="Your spoken words will appear here as you talk..."
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />

                        {answerTranscript.trim() && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={evaluateAnswer}
                              disabled={isEvaluating}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5"
                            >
                              {isEvaluating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              <span>Score My Answer</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Evaluation Results Card */}
                      {evalResult && (
                        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5 mt-3 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-900 text-xs">
                              Answer Scorecard
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-white border border-emerald-300 rounded text-emerald-800 font-bold text-[10px]">
                                Clarity: {evalResult.clarityScore}/100
                              </span>
                              <span className="px-2 py-0.5 bg-white border border-emerald-300 rounded text-emerald-800 font-bold text-[10px]">
                                Specificity: {evalResult.specificityScore}/100
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                  evalResult.fillerWordsCount > 2
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-emerald-100 text-emerald-900"
                                }`}
                              >
                                Fillers: {evalResult.fillerWordsCount}
                              </span>
                            </div>
                          </div>

                          <div className="text-emerald-950 text-xs">
                            <strong>Critique:</strong> {evalResult.feedback}
                          </div>

                          <div className="p-2.5 bg-white border border-emerald-200 rounded-lg text-slate-800 text-[11px]">
                            <strong>Suggested Model Answer:</strong>
                            <p className="mt-1 text-slate-600 italic">
                              &ldquo;{evalResult.suggestedRevision}&rdquo;
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
