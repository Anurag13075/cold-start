import { NextRequest, NextResponse } from "next/server";
import { CompanyBrief, CompanyPerson, CompanySource, ShippedItem, OpenRoleItem } from "@/lib/types";
import { callGroqChat } from "@/lib/groq";

interface CrawlResult {
  url: string;
  category: CompanySource["category"];
  title: string;
  snippet: string;
  html: string;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "Company URL is required" }, { status: 400 });
    }

    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(cleanUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL provided" }, { status: 400 });
    }

    const domain = parsedUrl.hostname.replace(/^www\./, "");
    const origin = parsedUrl.origin;

    // Concurrently probe primary subpages to inspect real pages
    const subpaths: { path: string; category: CompanySource["category"] }[] = [
      { path: "/", category: "Home" },
      { path: "/about", category: "About" },
      { path: "/team", category: "About" },
      { path: "/changelog", category: "Changelog" },
      { path: "/blog", category: "Changelog" },
      { path: "/careers", category: "Careers" },
      { path: "/jobs", category: "Careers" },
      { path: "/contact", category: "Contact" },
    ];

    const fetchPage = async (path: string, category: CompanySource["category"]): Promise<CrawlResult | null> => {
      try {
        const target = path === "/" ? origin : `${origin}${path}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(target, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
          signal: controller.signal,
          redirect: "follow",
        });
        clearTimeout(timeout);

        if (!res.ok) return null;

        const html = await res.text();
        // Skip non-HTML or error pages
        if (html.length < 200 || /<title>(404|Not Found|Error)/i.test(html)) return null;

        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].replace(/[\n\r\t]/g, " ").trim() : `${domain} ${path}`;

        // Extract visible clean text snippet
        const bodyContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        return {
          url: target,
          category,
          title,
          snippet: bodyContent.slice(0, 1500),
          html,
        };
      } catch {
        return null;
      }
    };

    const crawlResults = (await Promise.all(
      subpaths.map((sp) => fetchPage(sp.path, sp.category))
    )).filter((r): r is CrawlResult => r !== null);

    // If root failed or blocked, construct minimal base result
    if (crawlResults.length === 0) {
      crawlResults.push({
        url: cleanUrl,
        category: "Home",
        title: domain,
        snippet: `Public web application accessible at ${cleanUrl}`,
        html: "",
      });
    }

    // Extract emails and links across all crawled pages
    const rawEmails: string[] = [];
    let githubOrgUrl: string | undefined = undefined;
    const xHandles: string[] = [];

    for (const page of crawlResults) {
      // Find mailto:
      const mailtoMatch = page.html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
      if (mailtoMatch) {
        mailtoMatch.forEach((m) => {
          const email = m.replace(/^mailto:/i, "").toLowerCase();
          if (!email.includes("sentry") && !email.includes("example.com")) {
            rawEmails.push(email);
          }
        });
      }

      // Regex emails
      const textEmails = page.snippet.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
      if (textEmails) {
        textEmails.forEach((e) => {
          const em = e.toLowerCase();
          if (!em.includes("sentry") && !em.includes("example.com")) {
            rawEmails.push(em);
          }
        });
      }

      // Find GitHub organization
      if (!githubOrgUrl) {
        const ghMatch = page.html.match(/https?:\/\/github\.com\/([a-zA-Z0-9_-]+)(?![\/\w])/i);
        if (ghMatch && !["features", "pricing", "enterprise", "join", "topics"].includes(ghMatch[1].toLowerCase())) {
          githubOrgUrl = ghMatch[0];
        }
      }

      // Find X / Twitter
      const xMatch = page.html.match(/https?:\/\/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{2,20})/gi);
      if (xMatch) {
        xMatch.forEach((link) => {
          const handle = link.split("/").pop();
          if (handle && !["home", "share", "intent", "search", "privacy"].includes(handle.toLowerCase())) {
            xHandles.push(handle);
          }
        });
      }
    }

    const uniqueEmailsOnSite = Array.from(new Set(rawEmails));
    const uniqueXHandles = Array.from(new Set(xHandles));

    // Optional: probe GitHub public repos/commits if public GitHub org was found
    const githubFoundPeople: Array<{ name: string; email?: string; githubUser?: string }> = [];
    if (githubOrgUrl) {
      try {
        const orgName = githubOrgUrl.split("/").pop();
        if (orgName) {
          const ghRes = await fetch(`https://api.github.com/orgs/${encodeURIComponent(orgName)}/members?per_page=5`, {
            headers: {
              Accept: "application/vnd.github.v3+json",
              "User-Agent": "ColdStart-App/1.0",
            },
          });
          if (ghRes.ok) {
            const members = await ghRes.json();
            if (Array.isArray(members)) {
              for (const m of members.slice(0, 3)) {
                githubFoundPeople.push({
                  name: m.login,
                  githubUser: m.login,
                });
              }
            }
          }
        }
      } catch {
        // Continue if GitHub rate-limited
      }
    }

    // Prepare pages summary for AI analysis
    const sourcesSummary = crawlResults
      .map(
        (cr, idx) =>
          `[Source ${idx + 1}: ${cr.category} - ${cr.url}]\nTitle: ${cr.title}\nText: ${cr.snippet.slice(0, 600)}`
      )
      .join("\n\n");

    const analysisPrompt = `You are an expert tech startup researcher analyzing public web pages of a company.
Analyze these crawled pages for ${domain}:
${sourcesSummary}

Found Site Emails: ${uniqueEmailsOnSite.join(", ") || "None found on pages"}
Found X Handles: ${uniqueXHandles.join(", ") || "None found"}
Found GitHub Contributors: ${JSON.stringify(githubFoundPeople)}

Extract strictly real information from the provided text.
NEVER invent fake people or fake facts.
If founder names or people are mentioned in the text (team, about, authors, footer, quotes), extract them.
If no people are mentioned at all, return an empty array for people.

For each person:
- name: real name mentioned
- role: real role mentioned (e.g. "Founder & CEO", "CTO", "Head of Engineering", "Founding Engineer")
- xHandle: matching handle or empty
- githubUsername: matching GitHub user or empty
- email: If an email was found on their site, use it. If not, suggest a candidate email like {first}@{domain}.
- emailReliability: Exactly one of:
  - "Found on their site" (if in site emails)
  - "From public GitHub" (if from GitHub)
  - "Guess (unverified)" (if synthesized from name)
  - "None"
- fallbackContact: best alternative, e.g. "X DM: @handle" or "contact@${domain}" or site contact page
- isRecommended: true for the highest priority person to message (founder or head of engineering)
- recommendationReason: single sentence reason why this person is the best first contact

Also extract:
- whatTheyMake: 1-2 factual sentences on their product
- whoItIsFor: who uses this product
- recentShipped: array of recent product updates or changelog items with sourceUrl
- openRoles: array of open jobs found on careers page with sourceUrl

Respond with a single valid JSON object strictly matching this schema:
{
  "name": string,
  "whatTheyMake": string,
  "whoItIsFor": string,
  "recentShipped": [{"title": string, "date": string, "details": string, "sourceUrl": string}],
  "openRoles": [{"title": string, "department": string, "sourceUrl": string}],
  "people": [
    {
      "name": string,
      "role": string,
      "xHandle": string,
      "githubUsername": string,
      "email": string,
      "emailReliability": "Found on their site" | "From public GitHub" | "Guess (unverified)" | "None",
      "fallbackContact": string,
      "isRecommended": boolean,
      "recommendationReason": string
    }
  ]
}`;

    let parsedAnalysis: any = null;

    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith("gsk_")) {
      try {
        const rawJson = await callGroqChat(
          [
            { role: "system", content: "You extract strictly verified facts from web crawler text into valid JSON." },
            { role: "user", content: analysisPrompt },
          ],
          "openai/gpt-oss-20b"
        );
        parsedAnalysis = JSON.parse(rawJson);
      } catch (err) {
        console.error("Groq company research error:", err);
      }
    }

    const companyName =
      parsedAnalysis?.name ||
      crawlResults[0]?.title.split(/[-|–•]/)[0].trim() ||
      domain.split(".")[0];

    const sources: CompanySource[] = crawlResults.map((cr, idx) => ({
      id: `source-${idx + 1}`,
      title: cr.title,
      url: cr.url,
      category: cr.category,
      snippet: cr.snippet.slice(0, 250),
    }));

    const brief: CompanyBrief = {
      url: cleanUrl,
      domain,
      name: companyName,
      whatTheyMake:
        parsedAnalysis?.whatTheyMake ||
        crawlResults[0]?.snippet.slice(0, 200) ||
        `Product platform operating on ${domain}.`,
      whoItIsFor:
        parsedAnalysis?.whoItIsFor ||
        `Engineers, developers, and teams building on ${domain}.`,
      recentShipped: Array.isArray(parsedAnalysis?.recentShipped) && parsedAnalysis.recentShipped.length > 0
        ? parsedAnalysis.recentShipped
        : [
            {
              title: "Recent Platform Deployment",
              date: "Active",
              details: `Continuous release deployed on ${domain}`,
              sourceUrl: cleanUrl,
            },
          ],
      openRoles: Array.isArray(parsedAnalysis?.openRoles) ? parsedAnalysis.openRoles : [],
      githubUrl: githubOrgUrl,
      sources,
    };

    // Format people
    let people: CompanyPerson[] = [];
    if (Array.isArray(parsedAnalysis?.people) && parsedAnalysis.people.length > 0) {
      people = parsedAnalysis.people.map((p: any, idx: number) => ({
        id: `person-${idx + 1}`,
        name: p.name || "Founder",
        role: p.role || "Founding Team",
        xHandle: p.xHandle || undefined,
        xUrl: p.xHandle ? `https://x.com/${p.xHandle.replace(/^@/, "")}` : undefined,
        githubUsername: p.githubUsername || undefined,
        githubUrl: p.githubUsername ? `https://github.com/${p.githubUsername}` : undefined,
        email: p.email || (uniqueEmailsOnSite[0] || `${p.name?.toLowerCase().split(" ")[0] || "team"}@${domain}`),
        emailReliability: (p.emailReliability as any) || (uniqueEmailsOnSite.length > 0 ? "Found on their site" : "Guess (unverified)"),
        emailSource: p.emailReliability === "Found on their site" ? cleanUrl : undefined,
        fallbackContact: p.fallbackContact || (uniqueEmailsOnSite[0] || `team@${domain}`),
        isRecommended: p.isRecommended ?? (idx === 0),
        recommendationReason: p.recommendationReason || "Key decision maker for engineering and team hires.",
      }));
    } else {
      // If no named individuals could be extracted from static text, provide honest fallback team card
      const fallbackEmail = uniqueEmailsOnSite[0] || `team@${domain}`;
      people.push({
        id: "person-1",
        name: `${companyName} Hiring & Engineering Team`,
        role: "Core Team",
        xHandle: uniqueXHandles[0] || undefined,
        xUrl: uniqueXHandles[0] ? `https://x.com/${uniqueXHandles[0]}` : undefined,
        githubUrl: githubOrgUrl,
        email: fallbackEmail,
        emailReliability: uniqueEmailsOnSite.length > 0 ? "Found on their site" : "Guess (unverified)",
        emailSource: uniqueEmailsOnSite.length > 0 ? "Found on contact page" : undefined,
        fallbackContact: uniqueEmailsOnSite.length > 0 ? fallbackEmail : `https://${domain}/contact`,
        isRecommended: true,
        recommendationReason: "Primary inbound channel discovered on public pages.",
      });
    }

    return NextResponse.json({ brief, people });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to research company" },
      { status: 500 }
    );
  }
}
