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

    // Concurrently probe primary subpages + security.txt
    const initialPaths: { path: string; category: CompanySource["category"] }[] = [
      { path: "/", category: "Home" },
      { path: "/about", category: "About" },
      { path: "/team", category: "About" },
      { path: "/founders", category: "About" },
      { path: "/community", category: "About" },
      { path: "/changelog", category: "Changelog" },
      { path: "/releases", category: "Changelog" },
      { path: "/blog", category: "Changelog" },
      { path: "/careers", category: "Careers" },
      { path: "/jobs", category: "Careers" },
      { path: "/contact", category: "Contact" },
      { path: "/.well-known/security.txt", category: "Contact" },
      { path: "/security.txt", category: "Contact" },
    ];

    const fetchPage = async (
      path: string,
      category: CompanySource["category"]
    ): Promise<CrawlResult | null> => {
      try {
        const target = path.startsWith("http") ? path : path === "/" ? origin : `${origin}${path}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(target, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.8",
          },
          signal: controller.signal,
          redirect: "follow",
        });
        clearTimeout(timeout);

        if (!res.ok) return null;

        const html = await res.text();
        if (html.length < 50 || /<title>(404|Not Found|Error)/i.test(html)) return null;

        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch
          ? titleMatch[1].replace(/[\n\r\t]/g, " ").trim()
          : `${domain} ${path}`;

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
          snippet: bodyContent.slice(0, 1800),
          html,
        };
      } catch {
        return null;
      }
    };

    const crawlResults = (
      await Promise.all(initialPaths.map((sp) => fetchPage(sp.path, sp.category)))
    ).filter((r): r is CrawlResult => r !== null);

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

    // Extract emails, LinkedIn profiles, X handles, and GitHub links from all pages
    const rawEmails: string[] = [];
    let githubOrgUrl: string | undefined = undefined;
    const xHandles: string[] = [];
    const linkedInProfiles: string[] = [];

    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

    for (const page of crawlResults) {
      // 1. mailto: links
      const mailtoMatch = page.html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi);
      if (mailtoMatch) {
        mailtoMatch.forEach((m) => {
          const email = m.replace(/^mailto:/i, "").toLowerCase().split("?")[0];
          if (!email.includes("sentry") && !email.includes("example.com") && !email.includes("wix.com")) {
            rawEmails.push(email);
          }
        });
      }

      // 2. regex text emails
      const textEmails = (page.html + " " + page.snippet).match(emailRegex);
      if (textEmails) {
        textEmails.forEach((e) => {
          const em = e.toLowerCase();
          if (
            !em.includes("sentry") &&
            !em.includes("example.com") &&
            !em.includes(".png") &&
            !em.includes(".jpg") &&
            !em.includes("schema.org")
          ) {
            rawEmails.push(em);
          }
        });
      }

      // 3. LinkedIn profile links: https://linkedin.com/in/{slug}
      const linkedInMatch = page.html.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/gi);
      if (linkedInMatch) {
        linkedInMatch.forEach((l) => linkedInProfiles.push(l.replace(/\/$/, "")));
      }

      // 4. X / Twitter profiles
      const xMatch = page.html.match(/https?:\/\/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{2,25})/gi);
      if (xMatch) {
        xMatch.forEach((link) => {
          const handle = link.split("/").pop();
          if (
            handle &&
            !["home", "share", "intent", "search", "privacy", "tos", "i", "settings"].includes(
              handle.toLowerCase()
            )
          ) {
            xHandles.push(handle);
          }
        });
      }

      // 5. GitHub organization / user
      if (!githubOrgUrl) {
        const ghMatch = page.html.match(/https?:\/\/github\.com\/([a-zA-Z0-9_-]+)(?![\/\w])/i);
        if (
          ghMatch &&
          !["features", "pricing", "enterprise", "join", "topics", "site"].includes(
            ghMatch[1].toLowerCase()
          )
        ) {
          githubOrgUrl = ghMatch[0];
        }
      }
    }

    const uniqueEmailsOnSite = Array.from(new Set(rawEmails));
    const uniqueXHandles = Array.from(new Set(xHandles));
    const uniqueLinkedInProfiles = Array.from(new Set(linkedInProfiles));

    // Deep Public GitHub Exploration:
    // If public GitHub was found, query members AND commit authors!
    // Commit authors in public git history contain real developer/founder emails 99% of the time!
    const githubFoundPeople: Array<{
      name: string;
      email?: string;
      githubUser?: string;
      twitterUser?: string;
      blog?: string;
    }> = [];

    if (githubOrgUrl) {
      try {
        const orgName = githubOrgUrl.split("/").pop();
        if (orgName) {
          // 1. Fetch public members or user details
          const membersRes = await fetch(
            `https://api.github.com/orgs/${encodeURIComponent(orgName)}/members?per_page=6`,
            {
              headers: {
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "ColdStart-App/1.0",
              },
            }
          );

          let memberLogins: string[] = [];
          if (membersRes.ok) {
            const members = await membersRes.json();
            if (Array.isArray(members)) {
              memberLogins = members.slice(0, 4).map((m: any) => m.login);
            }
          } else {
            // Might be a user account instead of an org
            memberLogins = [orgName];
          }

          // 2. Fetch user profile metadata (returns name, email, twitter_username, blog)
          for (const login of memberLogins.slice(0, 3)) {
            try {
              const uRes = await fetch(
                `https://api.github.com/users/${encodeURIComponent(login)}`,
                {
                  headers: {
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "ColdStart-App/1.0",
                  },
                }
              );
              if (uRes.ok) {
                const uData = await uRes.json();
                githubFoundPeople.push({
                  name: uData.name || uData.login,
                  githubUser: uData.login,
                  email: uData.email || undefined,
                  twitterUser: uData.twitter_username || undefined,
                  blog: uData.blog || undefined,
                });
                if (uData.email) rawEmails.push(uData.email.toLowerCase());
                if (uData.twitter_username) xHandles.push(uData.twitter_username);
              }
            } catch {
              // Continue
            }
          }

          // 3. Inspect recent public commits to find commit author emails
          const reposRes = await fetch(
            `https://api.github.com/orgs/${encodeURIComponent(orgName)}/repos?sort=updated&per_page=3`,
            {
              headers: {
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "ColdStart-App/1.0",
              },
            }
          );

          if (reposRes.ok) {
            const repos = await reposRes.json();
            if (Array.isArray(repos) && repos[0]?.name) {
              const commitsRes = await fetch(
                `https://api.github.com/repos/${encodeURIComponent(orgName)}/${encodeURIComponent(
                  repos[0].name
                )}/commits?per_page=10`,
                {
                  headers: {
                    Accept: "application/vnd.github.v3+json",
                    "User-Agent": "ColdStart-App/1.0",
                  },
                }
              );

              if (commitsRes.ok) {
                const commits = await commitsRes.json();
                if (Array.isArray(commits)) {
                  for (const c of commits) {
                    const authorName = c.commit?.author?.name;
                    const authorEmail = c.commit?.author?.email;
                    if (
                      authorEmail &&
                      !authorEmail.includes("noreply") &&
                      !authorEmail.includes("github.com")
                    ) {
                      githubFoundPeople.push({
                        name: authorName || "Core Contributor",
                        email: authorEmail.toLowerCase(),
                      });
                      rawEmails.push(authorEmail.toLowerCase());
                    }
                  }
                }
              }
            }
          }
        }
      } catch {
        // Continue if GitHub rate-limited
      }
    }

    const allDiscoveredEmails = Array.from(new Set(rawEmails));
    const allDiscoveredX = Array.from(new Set(xHandles));
    const allDiscoveredLinkedIn = Array.from(new Set(linkedInProfiles));

    // Prepare pages summary for AI analysis
    const sourcesSummary = crawlResults
      .map(
        (cr, idx) =>
          `[Source ${idx + 1}: ${cr.category} - ${cr.url}]\nTitle: ${cr.title}\nText: ${cr.snippet.slice(
            0,
            600
          )}`
      )
      .join("\n\n");

    const analysisPrompt = `You are a Principal Tech Startup Researcher analyzing public pages of a company.
Analyze crawled pages for domain: ${domain}:
${sourcesSummary}

Discovered Site / Commit Emails: ${allDiscoveredEmails.join(", ") || "None"}
Discovered X / Twitter Profiles: ${allDiscoveredX.join(", ") || "None"}
Discovered LinkedIn Profiles: ${allDiscoveredLinkedIn.join(", ") || "None"}
Discovered GitHub People: ${JSON.stringify(githubFoundPeople)}

Extract strictly real information from the provided data.
NEVER invent fake people or fake facts.
Extract all real founders, CEOs, engineering leads, or key builders mentioned on the site or in team bios.

For each person:
- name: real full name
- role: real title (e.g. "Founder & CEO", "Founding Engineer", "Lead Developer")
- xHandle: matching X handle from discovered X profiles or empty
- githubUsername: matching GitHub username or empty
- linkedInUrl: matching LinkedIn URL from discovered LinkedIn profiles or empty
- email: If an email was discovered from their site or GitHub commits, use it. If not, generate their email based on standard domain patterns (e.g. {first}@{domain} or {first}.{last}@{domain}).
- emailReliability:
  - "Found on their site" (if in discovered site emails)
  - "From public GitHub" (if from GitHub commits/profile)
  - "Guess (unverified)" (if synthesized)
- fallbackContact: best alternative, e.g. X handle or site contact
- isRecommended: true for highest priority decision maker (founder/head of engineering)
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
      "linkedInUrl": string,
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
            {
              role: "system",
              content: "You extract strictly verified facts and real people from web crawler data into valid JSON.",
            },
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
      recentShipped:
        Array.isArray(parsedAnalysis?.recentShipped) && parsedAnalysis.recentShipped.length > 0
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

    // Format people and attach discovered socials
    let people: CompanyPerson[] = [];
    if (Array.isArray(parsedAnalysis?.people) && parsedAnalysis.people.length > 0) {
      people = parsedAnalysis.people.map((p: any, idx: number) => {
        const firstName = (p.name || "").split(" ")[0].toLowerCase();
        const lastName = (p.name || "").split(" ")[1]?.toLowerCase() || "";

        // Match LinkedIn if not already filled
        let matchedLinkedIn = p.linkedInUrl;
        if (!matchedLinkedIn && allDiscoveredLinkedIn.length > 0) {
          matchedLinkedIn = allDiscoveredLinkedIn.find((l) =>
            l.toLowerCase().includes(firstName) || (lastName && l.toLowerCase().includes(lastName))
          );
        }

        // Match X / Twitter handle
        let matchedXHandle = p.xHandle ? p.xHandle.replace(/^@/, "") : undefined;
        if (!matchedXHandle && allDiscoveredX.length > 0) {
          matchedXHandle = allDiscoveredX.find(
            (x) => x.toLowerCase().includes(firstName) || (lastName && x.toLowerCase().includes(lastName))
          );
        }

        // Determine real email & reliability
        let resolvedEmail = p.email;
        let reliability = p.emailReliability || "Guess (unverified)";

        // Check if an email for this person was directly found on site or commits
        const siteEmailMatch = allDiscoveredEmails.find(
          (e) => e.startsWith(firstName) || (lastName && e.includes(lastName))
        );

        if (siteEmailMatch) {
          resolvedEmail = siteEmailMatch;
          reliability = githubFoundPeople.some((gp) => gp.email === siteEmailMatch)
            ? "From public GitHub"
            : "Found on their site";
        } else if (!resolvedEmail) {
          resolvedEmail = `${firstName}@${domain}`;
          reliability = "Guess (unverified)";
        }

        return {
          id: `person-${idx + 1}`,
          name: p.name || "Founder",
          role: p.role || "Founding Team",
          xHandle: matchedXHandle,
          xUrl: matchedXHandle ? `https://x.com/${matchedXHandle}` : undefined,
          githubUsername: p.githubUsername || undefined,
          githubUrl: p.githubUsername ? `https://github.com/${p.githubUsername}` : undefined,
          linkedInUrl: matchedLinkedIn || undefined,
          email: resolvedEmail,
          emailReliability: reliability,
          emailSource: reliability !== "Guess (unverified)" ? cleanUrl : undefined,
          fallbackContact: matchedXHandle
            ? `@${matchedXHandle}`
            : allDiscoveredEmails[0] || `team@${domain}`,
          isRecommended: p.isRecommended ?? idx === 0,
          recommendationReason:
            p.recommendationReason || "Key decision maker for engineering and team hires.",
        };
      });
    } else {
      // Fallback team card
      const fallbackEmail = allDiscoveredEmails[0] || `team@${domain}`;
      people.push({
        id: "person-1",
        name: `${companyName} Hiring & Engineering Team`,
        role: "Core Team",
        xHandle: allDiscoveredX[0] || undefined,
        xUrl: allDiscoveredX[0] ? `https://x.com/${allDiscoveredX[0]}` : undefined,
        linkedInUrl: allDiscoveredLinkedIn[0] || undefined,
        githubUrl: githubOrgUrl,
        email: fallbackEmail,
        emailReliability: allDiscoveredEmails.length > 0 ? "Found on their site" : "Guess (unverified)",
        emailSource: allDiscoveredEmails.length > 0 ? "Discovered on public contact channel" : undefined,
        fallbackContact: allDiscoveredX[0] ? `@${allDiscoveredX[0]}` : fallbackEmail,
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
