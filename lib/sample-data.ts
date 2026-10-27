import {
  UserProfile,
  ScrapedCompany,
  GeneratedDrafts,
  PipelineItem,
  ReplyMetric,
} from "./types";

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: "Anurag",
  title: "Full-Stack Engineer & Builder",
  degreeOrStatus: "third-year CS student looking for a role on a small team",
  activeProject: "FormFlow",
  projects: [
    {
      id: "formflow",
      name: "FormFlow",
      description: "a voice form-filler that works offline-first",
      relevanceHook: "so I've hit the same sync edge cases",
      techStack: ["TypeScript", "IndexedDB", "Web Audio API", "CRDTs"],
    },
    {
      id: "handsfree",
      name: "Handsfree",
      description: "browser voice navigation with Vimium-style numbers",
      relevanceHook: "built full keyboard-free voice automation for web apps",
      techStack: ["Chrome Extension", "Web Speech API", "React"],
    },
    {
      id: "pulsequeue",
      name: "PulseQueue",
      description: "an edge message queue with sub-millisecond local caching",
      relevanceHook: "deep experience with edge replication and offline recovery",
      techStack: ["Rust", "Wasm", "Cloudflare Workers"],
    },
  ],
  email: "anurag@example.com",
};

export const INITIAL_COMPANY: ScrapedCompany = {
  url: "https://northwind.ai",
  domain: "northwind.ai",
  name: "Northwind AI",
  tagline: "Offline-first sync for field teams",
  aboutText:
    "Northwind AI enables industrial field technicians and inspection crews to collect, inspect, and log operational telemetry without continuous network connectivity, syncing conflict-free once reconnected.",
  sources: [
    {
      id: "changelog-oct20",
      title: "Changelog, Oct 20",
      category: "Changelog",
      date: "Oct 20",
      snippet:
        "Shipped full offline mode with local CRDT sync engine. Technicians can now capture heavy asset inspection logs 100% disconnected.",
    },
    {
      id: "pricing",
      title: "Pricing",
      category: "Pricing",
      snippet:
        "Field Team plan: $49/inspector/month. Includes unlimited offline storage, background conflict resolution, and enterprise audit logs.",
    },
    {
      id: "about",
      title: "About",
      category: "About",
      snippet:
        "Founded by ex-Palantir engineers solving synchronization latency in remote mining and offshore energy sites.",
    },
  ],
};

export const INITIAL_DRAFTS: GeneratedDrafts = {
  email: {
    subject: "Your offline mode, and a sync idea",
    body: `Hi Priya,\n\nI saw offline mode shipped in your Oct 20 changelog . I built FormFlow, a voice form-filler that works offline-first , so I've hit the same sync edge cases.\n\nCould I send you a two-minute walkthrough? I'm a third-year CS student looking for a role on a small team.\n\nAnurag`,
    highlightedPhrases: [
      {
        text: "offline mode shipped in your Oct 20 changelog",
        source: "Changelog, Oct 20",
        category: "founder-work",
      },
      {
        text: "FormFlow, a voice form-filler that works offline-first",
        source: "User Project: FormFlow",
        category: "user-project",
      },
    ],
  },
  dm: {
    body: `Hey Priya - saw the Oct 20 changelog update on offline mode for Northwind. I built FormFlow (a voice form-filler that works offline-first) and hit the exact same local sync edge cases. Mind if I send you a 2-minute video walkthrough of how I resolved background state collisions? (CS student looking for a small team)`,
  },
  followUpDay3: {
    subject: "Re: Your offline mode, and a sync idea",
    body: `Hi Priya,\n\nFollowing up on my note from Tuesday. Recorded a quick 90-second Loom showing how I handled offline state reconciliation in FormFlow that might be relevant to Northwind's field sync.\n\nHappy to send the link over if you're curious!\n\nAnurag`,
  },
  followUpDay7: {
    subject: "Re: Your offline mode, and a sync idea",
    body: `Hi Priya,\n\nLast check-in from me! Know how heads-down product sprints get when rolling out major features like offline mode. If you ever need an extra builder focused on sync or edge caching, would love to pitch in.\n\nCheering on Northwind either way!\n\nAnurag`,
  },
  sourcesUsed: ["Changelog, Oct 20", "Pricing", "About"],
  specificityScore: 92,
  checks: {
    namesProductDetail: true,
    under90Words: true,
    oneClearAsk: true,
    matchedProject: "FormFlow",
  },
  flags: [
    "Names a real product detail",
    "Under 90 words",
    "One clear ask",
    "Matched project: FormFlow. Swap?",
  ],
};

export const INITIAL_PIPELINE: PipelineItem[] = [
  {
    id: "lumen",
    companyName: "Lumen Health",
    domain: "lumenhealth.com",
    avatarLetter: "L",
    avatarBgColor: "bg-blue-100 text-blue-700",
    status: "follow_up_due",
    timeAgo: "Sent 3 days ago",
    dayDue: 3,
    lastSubject: "Prior-auth automation & latency idea",
    lastMessageSnippet:
      "Saw your update on HL7 parser improvements. Built a streaming medical entity extractor...",
  },
  {
    id: "parcel",
    companyName: "Parcel",
    domain: "parcel.so",
    avatarLetter: "P",
    avatarBgColor: "bg-purple-100 text-purple-700",
    status: "follow_up_due",
    timeAgo: "Sent 3 days ago",
    dayDue: 3,
    lastSubject: "Staging sandbox preview speeds",
    lastMessageSnippet:
      "Loved the microVM launch last week. Benchmarked our edge worker against cold start times...",
  },
  {
    id: "atlas",
    companyName: "Atlas Robotics",
    domain: "atlasrobotics.co",
    avatarLetter: "A",
    avatarBgColor: "bg-amber-100 text-amber-700",
    status: "sent",
    timeAgo: "Sent yesterday",
    lastSubject: "ROS2 fleet telemetry pipeline",
    lastMessageSnippet:
      "Saw your warehouse fleet orchestration demo on Twitter. Built a lightweight telemetry daemon...",
  },
  {
    id: "orbit",
    companyName: "Orbit Labs",
    domain: "orbitlabs.io",
    avatarLetter: "O",
    avatarBgColor: "bg-indigo-100 text-indigo-700",
    status: "replied",
    timeAgo: "Replied 2 hours ago",
    lastSubject: "Edge caching invalidation idea",
    replyText:
      "Hey Anurag, loved the FormFlow offline demo video! We're actually hitting some cache invalidation bottlenecks on edge clusters right now. Would you be free for a 15-minute chat this Thursday at 3pm PT?",
    replyCoachRecommendation: {
      summary: "Founder is inviting you to a 15-min chat on Thursday at 3pm PT.",
      suggestedReply:
        "Hi Alex, thanks so much for getting back! Thursday at 3pm PT works perfectly for me. Send over the Google Meet invite, and I'll have a few quick notes on the cache invalidation ideas ready. Talk soon!",
      keyPoints: [
        "Confirm the requested time slot immediately",
        "Offer to bring 2-3 prepared thoughts to maximize the 15 minutes",
        "Keep the confirmation brief and enthusiastic",
      ],
    },
  },
];

export const REPLY_METRICS: ReplyMetric[] = [
  {
    strategy: "Cites a recent changelog entry",
    rate: 41,
    isLeader: true,
  },
  {
    strategy: "Generic opener",
    rate: 8,
    isLeader: false,
  },
];
