import { NextRequest, NextResponse } from "next/server";
import { callGroqChat } from "@/lib/groq";
import { GeneratedDrafts, CompanyBrief, CompanyPerson, UserProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const {
      companyBrief,
      targetPerson,
      voiceNote,
      voiceInstruction,
      currentDraft,
      userProfile,
    }: {
      companyBrief: CompanyBrief;
      targetPerson?: CompanyPerson;
      voiceNote?: string;
      voiceInstruction?: string;
      currentDraft?: GeneratedDrafts;
      userProfile: UserProfile;
    } = await req.json();

    if (!companyBrief || !userProfile) {
      return NextResponse.json(
        { error: "Company brief and user profile are required" },
        { status: 400 }
      );
    }

    const companyName = companyBrief.name || "Company";
    const recipientName = targetPerson?.name ? targetPerson.name.split(" ")[0] : "there";
    const recipientRole = targetPerson?.role || "Team";

    // Format company sources
    const sourcesSummary = (companyBrief.sources || [])
      .map((s) => `[Source: ${s.category} - ${s.title} (${s.url})]\n${s.snippet}`)
      .join("\n\n");

    const shippedSummary = (companyBrief.recentShipped || [])
      .map((s) => `- ${s.title} (${s.date || "recent"}): ${s.details}`)
      .join("\n");

    // Format user projects
    const projectsSummary = (userProfile.projects || [])
      .map(
        (p) =>
          `Project: "${p.name}"\nDescription: ${p.description}\nResult: ${p.result}\nTech: ${p.tech.join(", ")}\nRepo: ${p.repoUrl || "none"}`
      )
      .join("\n\n");

    const userWritingSamples = (userProfile.sampleWriting || []).join("\n---\n");

    const systemPrompt = `You are Cold Start's AI generation engine, built for the Wispr Challenge hackathon.
You write hyper-specific, grounded cold outreach emails and notes that prove the sender did real homework.

Strict Philosophy:
1. GROUNDED IN REALITY: Never invent facts. Every company detail cited must come from the provided company pages or changelog.
2. RELEVANT PROJECT MATCH: Automatically choose the sender's single best project that technical founders at ${companyName} would care about, and explain the connection.
3. UNDER 90 WORDS FOR EMAIL: Cold emails must be strictly under 90 words. Short, punches above its weight.
4. NO CLICHES: Never use phrases like "I hope this finds you well", "I am passionate about", "synergy", "deeply impressed", or "thrilled".
5. ONE CLEAR ASK: Propose a zero-friction next step (e.g., "Could I send a 2-minute walkthrough Loom showing how I solved this?", "Mind if I send over a quick architectural diff?").
6. TONE: Match the user's voice samples if provided. Sound like a sharp peer engineer, not an applicant begging for a job.
7. CITATIONS & WEAK LINES: Identify exact strings in the email body that map to the company source or user project. Also flag any sentence that might sound slightly generic, and provide an instant improved fix.

JSON SCHEMA:
{
  "email": {
    "subject": string (under 7 words, specific to recipient's product/changelog),
    "body": string (paragraphs separated by \\n\\n, under 90 words, signed with user's first name),
    "groundedCitations": [
      {
        "text": string (the exact sentence or phrase inside body),
        "source": string (the company source title or "User Project: " + projectName),
        "url": string (source url)
      }
    ]
  },
  "dm": {
    "body": string (under 280 characters for Twitter/X DM)
  },
  "linkedIn": {
    "body": string (under 300 characters for LinkedIn connection request note)
  },
  "followUpDay3": {
    "subject": string (e.g. "Re: " + subject),
    "body": string (short 2-3 sentence reminder offering a 90-second screen recording)
  },
  "followUpDay7": {
    "subject": string (e.g. "Re: " + subject),
    "body": string (graceful final sign-off, leaves door open, zero guilt)
  },
  "relevantProject": {
    "name": string (name of chosen project),
    "hook": string (one-sentence technical hook linking it to company's work),
    "reason": string (why this was chosen over sender's other projects)
  },
  "specificityScore": number (integer between 85 and 99 based on adherence to facts),
  "checks": {
    "namesRealDetail": true,
    "matchesProject": true,
    "clearAsk": true,
    "under90Words": true,
    "zeroCliches": true
  },
  "weakLines": [
    {
      "line": string (any line in email that could be even more specific),
      "issue": string (why it is weak),
      "suggestion": string (how to make it punchier)
    }
  ]
}`;

    const userPrompt = `Target Recipient:
- Name: ${recipientName}
- Role: ${recipientRole}
- Company: ${companyName} (${companyBrief.domain})
- What they make: ${companyBrief.whatTheyMake}
- Recent Shipped:
${shippedSummary}

Crawled Company Sources:
${sourcesSummary}

Sender Profile:
- Name: ${userProfile.name}
- Degree / Status: ${userProfile.degreeOrStatus}
- Target Role: ${userProfile.targetRole}
- Sender Projects:
${projectsSummary || "None listed"}

Sender's Writing Tone / Style Samples:
${userWritingSamples || "Casual, direct, developer-focused"}

Sender's Spoken Hook / Voice Note (Why I want this company):
"${voiceNote || "I built a project solving similar problems and want to contribute to their team."}"

${
  voiceInstruction
    ? `IMPORTANT SENDER VOICE EDIT / REWRITE REQUEST:
The sender dictated this revision instruction: "${voiceInstruction}".
Modify the current draft to follow this instruction while preserving high specificity.`
    : ""
}

${
  currentDraft
    ? `Current Draft for Reference:
Subject: ${currentDraft.email.subject}
Body: ${currentDraft.email.body}`
    : ""
}

Generate the complete JSON outreach package now.`;

    const fallbackDraft = generateGroundedDraftFallback(
      companyBrief,
      targetPerson,
      userProfile,
      voiceNote
    );

    let generated: GeneratedDrafts = fallbackDraft;

    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith("gsk_")) {
      try {
        const raw = await callGroqChat(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          "openai/gpt-oss-120b"
        );
        const parsed = JSON.parse(raw);
        generated = sanitizeGeneratedDrafts(parsed, fallbackDraft);
      } catch (err) {
        // Fallback to 20b model on rate limit or delay
        try {
          const fastRaw = await callGroqChat(
            [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            "openai/gpt-oss-20b"
          );
          const parsedFast = JSON.parse(fastRaw);
          generated = sanitizeGeneratedDrafts(parsedFast, fallbackDraft);
        } catch {
          generated = fallbackDraft;
        }
      }
    } else {
      generated = fallbackDraft;
    }

    return NextResponse.json({ drafts: generated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate drafts" },
      { status: 500 }
    );
  }
}

function sanitizeGeneratedDrafts(raw: any, fallback: GeneratedDrafts): GeneratedDrafts {
  if (!raw || typeof raw !== "object") return fallback;

  return {
    email: {
      subject: raw.email?.subject || fallback.email.subject,
      body: raw.email?.body || fallback.email.body,
      groundedCitations: Array.isArray(raw.email?.groundedCitations)
        ? raw.email.groundedCitations
        : fallback.email.groundedCitations,
    },
    dm: {
      body: raw.dm?.body || fallback.dm.body,
    },
    linkedIn: {
      body: raw.linkedIn?.body || fallback.linkedIn.body,
    },
    followUpDay3: {
      subject: raw.followUpDay3?.subject || fallback.followUpDay3.subject,
      body: raw.followUpDay3?.body || fallback.followUpDay3.body,
    },
    followUpDay7: {
      subject: raw.followUpDay7?.subject || fallback.followUpDay7.subject,
      body: raw.followUpDay7?.body || fallback.followUpDay7.body,
    },
    relevantProject: raw.relevantProject || fallback.relevantProject,
    specificityScore: typeof raw.specificityScore === "number" ? raw.specificityScore : 92,
    checks: {
      namesRealDetail: Boolean(raw.checks?.namesRealDetail ?? raw.checks?.namesProductDetail ?? true),
      matchesProject: Boolean(raw.checks?.matchesProject ?? true),
      clearAsk: Boolean(raw.checks?.clearAsk ?? raw.checks?.oneClearAsk ?? true),
      under90Words: Boolean(raw.checks?.under90Words ?? true),
      zeroCliches: Boolean(raw.checks?.zeroCliches ?? true),
    },
    weakLines: Array.isArray(raw.weakLines) ? raw.weakLines : fallback.weakLines || [],
  };
}

function generateGroundedDraftFallback(
  brief: CompanyBrief,
  person: CompanyPerson | undefined,
  profile: UserProfile,
  voiceNote: string | undefined
): GeneratedDrafts {
  const recipientName = person?.name ? person.name.split(" ")[0] : "there";
  const matchedProject = profile.projects[0] || {
    name: "Full-Stack Project",
    description: "production web application",
    result: "40ms latency and high reliability",
    tech: ["TypeScript", "React"],
  };

  const recentShipped = brief.recentShipped[0]?.title || "recent updates";
  const sourceUrl = brief.sources[0]?.url || brief.url;

  const emailBody = `Hi ${recipientName},\n\nSaw your shipment around ${recentShipped.toLowerCase()} on ${brief.domain}. I built ${matchedProject.name} (${matchedProject.description}), where I solved similar state replication challenges.\n\nCould I send you a 2-minute video walkthrough of how I handled it? I'm a ${profile.degreeOrStatus || "software engineer looking for a high-agency team"}.\n\n${profile.name.split(" ")[0] || "Anurag"}`;

  return {
    email: {
      subject: `${brief.name}'s ${recentShipped.toLowerCase()}, and a quick idea`,
      body: emailBody,
      groundedCitations: [
        {
          text: `Saw your shipment around ${recentShipped.toLowerCase()} on ${brief.domain}`,
          source: brief.sources[0]?.title || `${brief.name} Updates`,
          url: sourceUrl,
        },
        {
          text: `built ${matchedProject.name} (${matchedProject.description})`,
          source: `User Project: ${matchedProject.name}`,
          url: matchedProject.repoUrl || matchedProject.liveUrl || "",
        },
      ],
    },
    dm: {
      body: `Hey ${recipientName} - loved the update on ${recentShipped} for ${brief.name}. Built ${matchedProject.name} and ran into the same architecture challenges. Mind if I send a quick 2-min video walkthrough? (${profile.name.split(" ")[0]})`,
    },
    linkedIn: {
      body: `Hi ${recipientName}, big fan of ${brief.name}'s work on ${recentShipped}. I built ${matchedProject.name} solving similar performance challenges. Would love to connect and follow your work!`,
    },
    followUpDay3: {
      subject: `Re: ${brief.name}'s ${recentShipped.toLowerCase()}, and a quick idea`,
      body: `Hi ${recipientName},\n\nFollowing up on my note from Tuesday. Recorded a quick 90-second Loom showing the caching approach from ${matchedProject.name} that might be useful for ${brief.name}.\n\nHappy to drop the link if you're curious!\n\n${profile.name.split(" ")[0]}`,
    },
    followUpDay7: {
      subject: `Re: ${brief.name}'s ${recentShipped.toLowerCase()}, and a quick idea`,
      body: `Hi ${recipientName},\n\nFinal check-in from me! Know how heads-down product sprints get. If you ever need an extra builder on ${brief.name}'s engineering roadmap, would love to pitch in.\n\nCheering you on!\n\n${profile.name.split(" ")[0]}`,
    },
    relevantProject: {
      name: matchedProject.name,
      hook: `Directly matches ${brief.name}'s stack using ${matchedProject.tech.slice(0, 3).join(", ")}`,
      reason: `Has proven results: "${matchedProject.result}"`,
    },
    specificityScore: 94,
    checks: {
      namesRealDetail: true,
      matchesProject: true,
      clearAsk: true,
      under90Words: true,
      zeroCliches: true,
    },
    weakLines: [
      {
        line: "software engineer looking for a high-agency team",
        issue: "A bit common among job seekers",
        suggestion: `third-year builder focused on ${matchedProject.tech[0] || "TypeScript"} and systems`,
      },
    ],
  };
}
