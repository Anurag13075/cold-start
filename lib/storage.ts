import {
  UserProfile,
  PipelineItem,
  AutopilotQueueItem,
  DoNotContactItem,
} from "./types";

const STORAGE_KEYS = {
  PROFILE: "cold_start_profile_v2",
  PIPELINE: "cold_start_pipeline_v2",
  AUTOPILOT_QUEUE: "cold_start_autopilot_queue_v2",
  DO_NOT_CONTACT: "cold_start_do_not_contact_v2",
  SETTINGS: "cold_start_settings_v2",
  DEMO_QUOTA: "cold_start_demo_quota_v2",
};

export const INITIAL_USER_PROFILE: UserProfile = {
  name: "Anurag",
  title: "Full-Stack Engineer & Builder",
  degreeOrStatus: "third-year CS student looking for an engineering role on a small team",
  targetRole: "Founding Engineer / Full-Stack Engineer",
  bio: "I build fast, voice-driven and local-first software. Passionate about developer tools and high-agency engineering teams.",
  githubUsername: "",
  portfolioUrl: "",
  xUrl: "",
  linkedInUrl: "",
  sampleWriting: [
    "Hi team, loved the recent release on sync. Built a similar local-first engine and hit identical CRDT edge cases. Could I send a 2-minute walkthrough video?",
  ],
  projects: [
    {
      id: "formflow",
      name: "FormFlow",
      description: "A voice form-filler that works offline-first using local-first storage and Web Audio API.",
      result: "Achieved 40ms local sync latency and handled 100% disconnected data collection without data loss.",
      tech: ["TypeScript", "IndexedDB", "Web Audio API", "CRDTs"],
      liveUrl: "https://formflow.example.com",
      repoUrl: "https://github.com/example/formflow",
      images: [],
      isShowcase: true,
    },
    {
      id: "handsfree",
      name: "Handsfree",
      description: "A Chrome extension that puts Vimium-style numbers on every web element for full voice browser navigation.",
      result: "Automated end-to-end browser workflows by voice with sub-200ms DOM badge tracking.",
      tech: ["Chrome Extension", "Web Speech API", "React", "Shadow DOM"],
      liveUrl: "https://handsfree.example.com",
      repoUrl: "https://github.com/example/handsfree",
      images: [],
      isShowcase: true,
    },
  ],
  updatedAt: new Date().toISOString(),
};

export function getStoredProfile(): UserProfile {
  if (typeof window === "undefined") return INITIAL_USER_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return INITIAL_USER_PROFILE;
}

export function saveStoredProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch {}
}

export function getStoredPipeline(): PipelineItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PIPELINE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveStoredPipeline(pipeline: PipelineItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.PIPELINE, JSON.stringify(pipeline));
  } catch {}
}

export function getStoredAutopilotQueue(): AutopilotQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTOPILOT_QUEUE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveStoredAutopilotQueue(queue: AutopilotQueueItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.AUTOPILOT_QUEUE, JSON.stringify(queue));
  } catch {}
}

export function getStoredDoNotContact(): DoNotContactItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DO_NOT_CONTACT);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveStoredDoNotContact(list: DoNotContactItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.DO_NOT_CONTACT, JSON.stringify(list));
  } catch {}
}

export function getDemoQuota(): number {
  if (typeof window === "undefined") return 3;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DEMO_QUOTA);
    if (raw) return parseInt(raw, 10);
  } catch {}
  return 3;
}

export function decrementDemoQuota(): number {
  if (typeof window === "undefined") return 0;
  const current = getDemoQuota();
  const next = Math.max(0, current - 1);
  try {
    localStorage.setItem(STORAGE_KEYS.DEMO_QUOTA, String(next));
  } catch {}
  return next;
}
