"use client";

import React, { useState, useRef } from "react";
import { UserProfile, ProjectItem, ResumeData } from "@/lib/types";
import { saveStoredProfile } from "@/lib/storage";
import {
  X,
  Plus,
  Trash2,
  Github,
  FileText,
  Mic,
  MicOff,
  Image as ImageIcon,
  Check,
  ExternalLink,
  Sparkles,
  Loader2,
  FolderGit2,
  User,
  Briefcase,
  Upload,
} from "lucide-react";

interface ProfileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onProfileUpdate: (updated: UserProfile) => void;
}

export function ProfileManagerModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdate,
}: ProfileManagerModalProps) {
  const [activeTab, setActiveTab] = useState<"projects" | "github" | "resume" | "voice" | "socials">("projects");
  const [formData, setFormData] = useState<UserProfile>(profile);

  // GitHub import state
  const [githubUser, setGithubUser] = useState(profile.githubUsername || "");
  const [isImportingGithub, setIsImportingGithub] = useState(false);
  const [importedRepos, setImportedRepos] = useState<ProjectItem[]>([]);
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [githubError, setGithubError] = useState("");

  // Resume parse state
  const [resumeText, setResumeText] = useState("");
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeSuccess, setResumeSuccess] = useState(false);

  // New project manual form
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem>({
    id: "",
    name: "",
    description: "",
    result: "",
    tech: [],
    liveUrl: "",
    repoUrl: "",
    images: [],
    isShowcase: true,
  });
  const [techInput, setTechInput] = useState("");

  // Voice Onboarding State
  const [voiceStep, setVoiceStep] = useState<0 | 1 | 2 | 3>(0);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceAnswers, setVoiceAnswers] = useState(["", "", ""]);
  const recognitionRef = useRef<any>(null);

  if (!isOpen) return null;

  // Handle GitHub Import
  const handleFetchGithubRepos = async () => {
    if (!githubUser.trim()) return;
    setIsImportingGithub(true);
    setGithubError("");
    try {
      const res = await fetch("/api/github-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: githubUser.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGithubError(data.error || "Failed to fetch GitHub repositories");
      } else {
        setImportedRepos(data.projects || []);
        setSelectedRepoIds((data.projects || []).slice(0, 3).map((p: any) => p.id));
      }
    } catch (err: any) {
      setGithubError(err.message || "Network error fetching repos");
    } finally {
      setIsImportingGithub(false);
    }
  };

  const handleAddSelectedRepos = () => {
    const toAdd = importedRepos.filter((r) => selectedRepoIds.includes(r.id));
    const merged = [...formData.projects];
    toAdd.forEach((repo) => {
      if (!merged.some((p) => p.name.toLowerCase() === repo.name.toLowerCase())) {
        merged.push(repo);
      }
    });

    const updated = {
      ...formData,
      githubUsername: githubUser.trim(),
      projects: merged,
    };
    setFormData(updated);
    setActiveTab("projects");
  };

  // Handle Resume Parse
  const handleParseResume = async () => {
    if (!resumeText.trim()) return;
    setIsParsingResume(true);
    setResumeSuccess(false);
    try {
      const res = await fetch("/api/resume-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: resumeText }),
      });
      const data = await res.json();
      if (res.ok && data.resume) {
        setFormData((prev) => ({
          ...prev,
          resume: data.resume,
          degreeOrStatus: data.resume.education[0] || prev.degreeOrStatus,
        }));
        setResumeSuccess(true);
      }
    } catch {
      // Continue
    } finally {
      setIsParsingResume(false);
    }
  };

  // Handle Image Upload for Projects
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64 = loadEvent.target?.result as string;
        if (base64) {
          setEditingProject((prev) => ({
            ...prev,
            images: [...prev.images, base64],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Save Project
  const handleSaveProject = () => {
    if (!editingProject.name.trim() || !editingProject.description.trim()) return;
    const projectToSave: ProjectItem = {
      ...editingProject,
      id: editingProject.id || editingProject.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      tech: editingProject.tech.length > 0 ? editingProject.tech : ["TypeScript", "React"],
    };

    const existingIndex = formData.projects.findIndex((p) => p.id === projectToSave.id);
    let updatedProjects = [...formData.projects];
    if (existingIndex >= 0) {
      updatedProjects[existingIndex] = projectToSave;
    } else {
      updatedProjects.push(projectToSave);
    }

    setFormData({ ...formData, projects: updatedProjects });
    setShowAddProject(false);
    setEditingProject({
      id: "",
      name: "",
      description: "",
      result: "",
      tech: [],
      liveUrl: "",
      repoUrl: "",
      images: [],
      isShowcase: true,
    });
  };

  // Delete Project
  const handleDeleteProject = (id: string) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter((p) => p.id !== id),
    });
  };

  // Voice Onboarding Interview Controls
  const voiceQuestions = [
    "Question 1: What is your primary technical focus, target role, and one-sentence background?",
    "Question 2: Tell me about your flagship project: what did it do, and what was the quantifiable result?",
    "Question 3: What kind of startup culture or engineering challenges are you looking to join?",
  ];

  const startVoiceQuestion = (stepIndex: number) => {
    setVoiceStep((stepIndex + 1) as any);
    setIsVoiceRecording(true);

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
        setVoiceAnswers((prev) => {
          const next = [...prev];
          next[stepIndex] = finalTrans;
          return next;
        });
      };

      rec.onerror = () => setIsVoiceRecording(false);
      rec.onend = () => setIsVoiceRecording(false);
      rec.start();
      recognitionRef.current = rec;
    }
  };

  const stopVoiceQuestion = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsVoiceRecording(false);
  };

  const applyVoiceAnswersToProfile = () => {
    const updated = {
      ...formData,
      degreeOrStatus: voiceAnswers[0] || formData.degreeOrStatus,
      targetRole: voiceAnswers[0] ? voiceAnswers[0].slice(0, 50) : formData.targetRole,
      bio: voiceAnswers[2] || formData.bio,
      sampleWriting: voiceAnswers[1] ? [voiceAnswers[1], ...formData.sampleWriting] : formData.sampleWriting,
    };
    setFormData(updated);
    setActiveTab("projects");
  };

  // Master Save
  const handleMasterSave = () => {
    const updated = { ...formData, updatedAt: new Date().toISOString() };
    saveStoredProfile(updated);
    onProfileUpdate(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              {formData.name.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Your Cold Start Profile</h3>
              <p className="text-xs text-slate-500">
                Saved locally. Reused for every company to generate grounded proof.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 bg-slate-50/50 text-xs font-semibold text-slate-600 shrink-0">
          <button
            onClick={() => setActiveTab("projects")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "projects"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>My Projects ({formData.projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("github")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "github"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub Import</span>
          </button>

          <button
            onClick={() => setActiveTab("resume")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "resume"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Resume Parser</span>
          </button>

          <button
            onClick={() => setActiveTab("voice")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "voice"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-blue-600">Voice Interview</span>
          </button>

          <button
            onClick={() => setActiveTab("socials")}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "socials"
                ? "border-blue-600 text-blue-600 bg-white"
                : "border-transparent hover:text-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Role & Writing Style</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* TAB 1: PROJECTS */}
          {activeTab === "projects" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">Saved Projects</h4>
                  <p className="text-slate-500 text-xs">
                    Every draft pairs the target company&apos;s recent work with one of these projects.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingProject({
                      id: "",
                      name: "",
                      description: "",
                      result: "",
                      tech: [],
                      liveUrl: "",
                      repoUrl: "",
                      images: [],
                      isShowcase: true,
                    });
                    setShowAddProject(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Project</span>
                </button>
              </div>

              {/* Add / Edit Project Form */}
              {showAddProject && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="font-semibold text-slate-900 text-sm">
                    {editingProject.id ? "Edit Project" : "Add New Project"}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Project Name</label>
                      <input
                        type="text"
                        value={editingProject.name}
                        onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                        placeholder="e.g. FormFlow"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Quantifiable Result / Metrics</label>
                      <input
                        type="text"
                        value={editingProject.result}
                        onChange={(e) => setEditingProject({ ...editingProject, result: e.target.value })}
                        placeholder="e.g. 40ms sync latency, used by 1,200 users"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-slate-700 block mb-1">What you built (Description)</label>
                    <textarea
                      rows={2}
                      value={editingProject.description}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      placeholder="e.g. A voice form-filler that works offline-first using local-first storage and Web Audio API"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Live Demo URL</label>
                      <input
                        type="text"
                        value={editingProject.liveUrl || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, liveUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-medium text-slate-700 block mb-1">Repo URL</label>
                      <input
                        type="text"
                        value={editingProject.repoUrl || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, repoUrl: e.target.value })}
                        placeholder="https://github.com/..."
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  {/* Screenshots Upload */}
                  <div>
                    <label className="font-medium text-slate-700 block mb-1 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Project Screenshots (Used in Pitch Pages)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Screenshots</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-slate-400 text-[11px]">
                        {editingProject.images.length} uploaded
                      </span>
                    </div>

                    {editingProject.images.length > 0 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                        {editingProject.images.map((img, idx) => (
                          <div key={idx} className="relative w-16 h-12 rounded border overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt="preview" className="w-full h-full object-cover" />
                            <button
                              onClick={() =>
                                setEditingProject({
                                  ...editingProject,
                                  images: editingProject.images.filter((_, i) => i !== idx),
                                })
                              }
                              className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => setShowAddProject(false)}
                      className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProject}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Save Project
                    </button>
                  </div>
                </div>
              )}

              {/* Projects List */}
              <div className="space-y-2.5">
                {formData.projects.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-xl text-slate-400">
                    No projects added yet. Import from GitHub or add one manually above!
                  </div>
                ) : (
                  formData.projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{proj.name}</div>
                          <div className="text-slate-600 text-xs mt-0.5">{proj.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingProject(proj);
                              setShowAddProject(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-emerald-700 font-medium text-[11px]">
                        <strong>Result:</strong> {proj.result}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                        {proj.tech.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {t}
                          </span>
                        ))}
                        {proj.liveUrl && (
                          <a
                            href={proj.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-0.5 ml-2"
                          >
                            Live Demo <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {proj.repoUrl && (
                          <a
                            href={proj.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-600 hover:underline flex items-center gap-0.5 ml-1"
                          >
                            Repo <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        {proj.images.length > 0 && (
                          <span className="text-purple-600 ml-1">
                            • {proj.images.length} screenshots
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB IMPORT */}
          {activeTab === "github" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Import from GitHub</h4>
                <p className="text-slate-500 text-xs">
                  Enter your GitHub handle to fetch your real repositories, descriptions, and tech stacks.
                </p>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Github className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={githubUser}
                    onChange={(e) => setGithubUser(e.target.value)}
                    placeholder="e.g. torvalds or your-github-handle"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs"
                  />
                </div>
                <button
                  onClick={handleFetchGithubRepos}
                  disabled={isImportingGithub}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-black transition-colors flex items-center gap-1.5"
                >
                  {isImportingGithub && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Fetch Repos</span>
                </button>
              </div>

              {githubError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {githubError}
                </div>
              )}

              {importedRepos.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Select projects to add ({importedRepos.length} found):</span>
                    <button
                      onClick={handleAddSelectedRepos}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                    >
                      Import Selected ({selectedRepoIds.length})
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {importedRepos.map((repo) => {
                      const isChecked = selectedRepoIds.includes(repo.id);
                      return (
                        <div
                          key={repo.id}
                          onClick={() => {
                            setSelectedRepoIds((prev) =>
                              isChecked ? prev.filter((id) => id !== repo.id) : [...prev, repo.id]
                            );
                          }}
                          className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start gap-2.5 ${
                            isChecked
                              ? "border-blue-500 bg-blue-50/30"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="font-bold text-slate-900">{repo.name}</div>
                            <div className="text-slate-600 text-[11px]">{repo.description}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {repo.tech.map((t, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-600">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESUME PARSER */}
          {activeTab === "resume" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Resume Parser</h4>
                <p className="text-slate-500 text-xs">
                  Paste your resume text below. Groq extracts education, skills, experience, and links.
                </p>
              </div>

              <textarea
                rows={7}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your raw resume text here (Education, Experience, Skills)..."
                className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono"
              />

              <div className="flex items-center justify-between">
                <button
                  onClick={handleParseResume}
                  disabled={isParsingResume || !resumeText.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                >
                  {isParsingResume && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Parse Resume with Groq</span>
                </button>

                {resumeSuccess && (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1 text-xs">
                    <Check className="w-4 h-4" /> Parsed &amp; Saved
                  </span>
                )}
              </div>

              {formData.resume && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-800">Parsed Profile Data:</div>
                  <div>
                    <strong>Education:</strong> {formData.resume.education.join(" • ") || "None"}
                  </div>
                  <div>
                    <strong>Skills:</strong>{" "}
                    {formData.resume.skills.slice(0, 10).join(", ") || "None"}
                  </div>
                  <div>
                    <strong>Links:</strong> {formData.resume.links.join(", ") || "None"}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VOICE ONBOARDING INTERVIEW */}
          {activeTab === "voice" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Wispr Flow Voice Onboarding</span>
                </div>
                <p className="text-blue-800 text-xs mt-1">
                  Answer 3 quick questions with your voice. Cold Start transcribes and sets up your profile automatically.
                </p>
              </div>

              <div className="space-y-3">
                {voiceQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      voiceStep === idx + 1
                        ? "border-blue-500 bg-blue-50/30"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-slate-800 text-xs">{q}</div>
                      {isVoiceRecording && voiceStep === idx + 1 ? (
                        <button
                          onClick={stopVoiceQuestion}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold animate-pulse"
                        >
                          <MicOff className="w-3.5 h-3.5" /> Stop
                        </button>
                      ) : (
                        <button
                          onClick={() => startVoiceQuestion(idx)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                        >
                          <Mic className="w-3.5 h-3.5" /> Speak
                        </button>
                      )}
                    </div>

                    <div className="mt-2">
                      <textarea
                        rows={2}
                        value={voiceAnswers[idx]}
                        onChange={(e) => {
                          const val = e.target.value;
                          setVoiceAnswers((prev) => {
                            const next = [...prev];
                            next[idx] = val;
                            return next;
                          });
                        }}
                        placeholder="Spoken transcript will appear here (or type manually)..."
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={applyVoiceAnswersToProfile}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
              >
                Apply Spoken Answers to Profile
              </button>
            </div>
          )}

          {/* TAB 5: ROLE & WRITING STYLE */}
          {activeTab === "socials" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Your Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Target Role</label>
                  <input
                    type="text"
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    placeholder="e.g. Founding Engineer, Full-Stack Intern"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Status / Background (Included in emails)
                </label>
                <input
                  type="text"
                  value={formData.degreeOrStatus}
                  onChange={(e) => setFormData({ ...formData, degreeOrStatus: e.target.value })}
                  placeholder="e.g. third-year CS student looking for a role on a small team"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-medium text-slate-700 block mb-1">Portfolio URL</label>
                  <input
                    type="text"
                    value={formData.portfolioUrl || ""}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">X (Twitter) Profile</label>
                  <input
                    type="text"
                    value={formData.xUrl || ""}
                    onChange={(e) => setFormData({ ...formData, xUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-700 block mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={formData.linkedInUrl || ""}
                    onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">
                  Writing Style Sample (Past email or post so drafts sound like you)
                </label>
                <textarea
                  rows={3}
                  value={(formData.sampleWriting || [])[0] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sampleWriting: [e.target.value],
                    })
                  }
                  placeholder="Paste a past email or tweet that represents how you speak directly..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {formData.projects.length} project(s) ready for outreach matching
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200/60 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleMasterSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
