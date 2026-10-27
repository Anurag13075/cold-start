export interface ProjectProfile {
  id: string;
  name: string;
  description: string;
  relevanceHook: string;
  techStack: string[];
}

export interface UserProfile {
  name: string;
  title: string;
  degreeOrStatus: string;
  activeProject: string;
  projects: ProjectProfile[];
  email?: string;
}

export interface CompanySource {
  id: string;
  title: string;
  category: "Changelog" | "Pricing" | "About" | "Features" | "Blog";
  date?: string;
  snippet: string;
}

export interface ScrapedCompany {
  url: string;
  domain: string;
  name: string;
  tagline: string;
  aboutText: string;
  sources: CompanySource[];
}

export interface HighlightedPhrase {
  text: string;
  source: string;
  category: "founder-work" | "user-project" | "ask";
}

export interface GeneratedDrafts {
  email: {
    subject: string;
    body: string;
    highlightedPhrases: HighlightedPhrase[];
  };
  dm: {
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
  sourcesUsed: string[];
  specificityScore: number;
  checks: {
    namesProductDetail: boolean;
    under90Words: boolean;
    oneClearAsk: boolean;
    matchedProject: string;
  };
  flags: string[];
}

export interface PipelineItem {
  id: string;
  companyName: string;
  domain: string;
  avatarLetter: string;
  avatarBgColor?: string;
  status: "follow_up_due" | "sent" | "replied";
  timeAgo: string;
  dayDue?: number;
  lastSubject?: string;
  lastMessageSnippet?: string;
  replyText?: string;
  replyCoachRecommendation?: {
    summary: string;
    suggestedReply: string;
    keyPoints: string[];
  };
}

export interface ReplyMetric {
  strategy: string;
  rate: number;
  isLeader: boolean;
}
