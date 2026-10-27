export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  result: string; // real metrics / outcome (e.g. "Used by 1,200 users, 40ms sync latency")
  tech: string[];
  liveUrl?: string;
  repoUrl?: string;
  images: string[]; // screenshot URLs / base64 data URLs
  isShowcase: boolean;
}

export interface ResumeData {
  education: string[];
  skills: string[];
  experience: {
    role: string;
    company: string;
    period: string;
    bullets: string[];
  }[];
  links: string[];
}

export interface UserProfile {
  name: string;
  title: string;
  degreeOrStatus: string;
  targetRole: string;
  bio: string;
  portfolioUrl?: string;
  githubUsername?: string;
  xUrl?: string;
  linkedInUrl?: string;
  sampleWriting: string[]; // past emails or posts so drafts sound like user
  projects: ProjectItem[];
  resume?: ResumeData;
  updatedAt: string;
}

export interface CompanySource {
  id: string;
  title: string;
  url: string;
  category: "Home" | "Changelog" | "About" | "Pricing" | "Careers" | "GitHub" | "Contact";
  snippet: string;
  date?: string;
}

export interface ShippedItem {
  title: string;
  date?: string;
  details: string;
  sourceUrl: string;
}

export interface OpenRoleItem {
  title: string;
  department?: string;
  sourceUrl: string;
}

export interface CompanyBrief {
  url: string;
  domain: string;
  name: string;
  whatTheyMake: string;
  whoItIsFor: string;
  recentShipped: ShippedItem[];
  openRoles: OpenRoleItem[];
  githubUrl?: string;
  sources: CompanySource[];
  rawSummary?: string;
}

export type EmailReliability =
  | "Found on their site"
  | "From public GitHub"
  | "Guess (unverified)"
  | "None";

export interface CompanyPerson {
  id: string;
  name: string;
  role: string;
  xHandle?: string;
  xUrl?: string;
  githubUsername?: string;
  githubUrl?: string;
  email?: string;
  emailReliability: EmailReliability;
  emailSource?: string;
  fallbackContact?: string; // e.g. "team@domain.com" or "X DM: @handle"
  isRecommended: boolean;
  recommendationReason?: string;
}

export interface GroundedCitation {
  text: string;
  source: string;
  url: string;
}

export interface WeakLine {
  line: string;
  issue: string;
  suggestion: string;
}

export interface GeneratedDrafts {
  email: {
    subject: string;
    body: string;
    groundedCitations: GroundedCitation[];
  };
  dm: {
    body: string;
  };
  linkedIn: {
    body: string;
  };
  followUpDay3: {
    subject: string;
    body: string;
  };
  followUpDay7: {
    subject: string;
    body: string;
  };
  relevantProject: {
    name: string;
    hook: string;
    reason: string;
  };
  specificityScore: number;
  checks: {
    namesRealDetail: boolean;
    matchesProject: boolean;
    clearAsk: boolean;
    under90Words: boolean;
    zeroCliches: boolean;
  };
  weakLines: WeakLine[];
}

export type PipelineStatus =
  | "Researching"
  | "Drafted"
  | "Approved"
  | "Sent"
  | "Follow-up due"
  | "Replied"
  | "Interview"
  | "Closed";

export interface PipelineItem {
  id: string;
  companyDomain: string;
  companyName: string;
  companyUrl: string;
  person: CompanyPerson;
  status: PipelineStatus;
  createdAt: string;
  sentAt?: string;
  followUpDay3Due?: string;
  followUpDay7Due?: string;
  drafts: GeneratedDrafts;
  brief: CompanyBrief;
  voiceNote?: string;
  replyDate?: string;
  replyText?: string;
  replyCoachRecommendation?: {
    summary: string;
    suggestedReply: string;
    keyPoints: string[];
  };
}

export interface AutopilotQueueItem {
  id: string;
  url: string;
  domain: string;
  status: "queued" | "researching" | "drafted" | "approved" | "skipped" | "failed";
  progressMsg?: string;
  companyBrief?: CompanyBrief;
  people?: CompanyPerson[];
  selectedPerson?: CompanyPerson;
  drafts?: GeneratedDrafts;
  error?: string;
  approvedScheduledDate?: string;
}

export interface DoNotContactItem {
  domainOrEmail: string;
  addedAt: string;
  reason?: string;
}

export interface RepoIssue {
  title: string;
  number: number;
  url: string;
  labels: string[];
  matchReason: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  context: string;
  idealKeyPoints: string[];
  userAnswerTranscript?: string;
  clarityScore?: number;
  specificityScore?: number;
  fillerWordsCount?: number;
  feedback?: string;
}
