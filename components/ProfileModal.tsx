"use client";

import React, { useState } from "react";
import { UserProfile, ProjectProfile } from "@/lib/types";
import { X, Plus, Check, Briefcase, GraduationCap, User } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSave: (updated: UserProfile) => void;
}

export function ProfileModal({ isOpen, onClose, profile, onSave }: ProfileModalProps) {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    relevanceHook: "",
  });
  const [showAddProject, setShowAddProject] = useState(false);

  if (!isOpen) return null;

  const handleAddProject = () => {
    if (!newProject.name.trim() || !newProject.description.trim()) return;
    const project: ProjectProfile = {
      id: newProject.name.toLowerCase().replace(/\s+/g, "-"),
      name: newProject.name.trim(),
      description: newProject.description.trim(),
      relevanceHook: newProject.relevanceHook.trim() || "built similar architecture",
      techStack: [],
    };
    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, project],
      activeProject: project.name,
    }));
    setNewProject({ name: "", description: "", relevanceHook: "" });
    setShowAddProject(false);
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {formData.name.slice(0, 1)}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Sender Profile</h3>
              <p className="text-xs text-slate-500">
                Cold Start uses this to match your real projects to founders
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

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Your Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
              placeholder="e.g. Anurag"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              Status / College / One-Line Background
            </label>
            <input
              type="text"
              value={formData.degreeOrStatus}
              onChange={(e) =>
                setFormData({ ...formData, degreeOrStatus: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
              placeholder="e.g. third-year CS student looking for a role on a small team"
            />
          </div>

          {/* Projects Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Your Proof Projects
              </label>
              <button
                type="button"
                onClick={() => setShowAddProject(!showAddProject)}
                className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add project
              </button>
            </div>

            <div className="space-y-2">
              {formData.projects.map((proj) => {
                const isActive = formData.activeProject === proj.name;
                return (
                  <div
                    key={proj.id}
                    onClick={() => setFormData({ ...formData, activeProject: proj.name })}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isActive
                        ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 text-sm">
                        {proj.name}
                      </span>
                      {isActive && (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active lead
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{proj.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Add Project Form */}
            {showAddProject && (
              <div className="mt-3 p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2.5">
                <input
                  type="text"
                  placeholder="Project name (e.g. FormFlow)"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                />
                <input
                  type="text"
                  placeholder="One-line description (e.g. a voice form-filler that works offline-first)"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({ ...newProject, description: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddProject(false)}
                    className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save Project
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Active: <strong className="text-slate-800">{formData.activeProject}</strong>
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
