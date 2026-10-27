import { NextRequest, NextResponse } from "next/server";
import { UserProfile, CompanyBrief } from "@/lib/types";
import { callGroqChat } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { userProfile, companyBrief }: { userProfile: UserProfile; companyBrief: CompanyBrief } =
      await req.json();

    if (!userProfile || !companyBrief) {
      return NextResponse.json(
        { error: "User profile and company brief are required" },
        { status: 400 }
      );
    }

    const companyContext = `Company: ${companyBrief.name} (${companyBrief.domain})
What they make: ${companyBrief.whatTheyMake}
Who it is for: ${companyBrief.whoItIsFor}
Recent shipped: ${companyBrief.recentShipped.map((s) => s.title).join(", ")}`;

    const userProjects = (userProfile.projects || [])
      .map((p) => `- ${p.name}: ${p.description}. Results: ${p.result}. Tech: ${p.tech.join(", ")}`)
      .join("\n");

    const prompt = `You are a technical resume optimizer for engineering roles.
Tailor this engineer's resume specifically for the company: "${companyBrief.name}".
Re-order their projects and experience so the items most relevant to "${companyBrief.whatTheyMake}" appear at the very top.
Highlight matching technical skills. Do not invent fake jobs or fake degrees.

Company Context:
${companyContext}

User Profile:
Name: ${userProfile.name}
Title: ${userProfile.title}
Background: ${userProfile.degreeOrStatus}
Target Role: ${userProfile.targetRole}
Existing Skills: ${(userProfile.resume?.skills || []).join(", ") || "TypeScript, React, Node.js, Python"}
Education: ${(userProfile.resume?.education || []).join("; ") || userProfile.degreeOrStatus}
Projects:
${userProjects}

Return a single JSON object matching this schema:
{
  "tailoredSummary": string (1-2 sharp lines explaining why this builder fits ${companyBrief.name}),
  "prioritizedSkills": string[] (skills matching company at front),
  "tailoredProjects": [
    {
      "name": string,
      "bullets": string[]
    }
  ],
  "printableHtml": string (complete, beautiful inline-styled HTML for a 1-page printable resume, including window.print() styling)
}`;

    let result: any = null;

    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith("gsk_")) {
      try {
        const rawJson = await callGroqChat(
          [
            { role: "system", content: "You output valid JSON for tailored resume generation." },
            { role: "user", content: prompt },
          ],
          "openai/gpt-oss-20b"
        );
        result = JSON.parse(rawJson);
      } catch (err) {
        console.error("Groq tailored resume error:", err);
      }
    }

    if (!result) {
      result = generateFallbackTailoredResume(userProfile, companyBrief);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate tailored resume" },
      { status: 500 }
    );
  }
}

function generateFallbackTailoredResume(profile: UserProfile, company: CompanyBrief) {
  const topProjects = (profile.projects || []).slice(0, 3);
  const skills = profile.resume?.skills?.length
    ? profile.resume.skills
    : ["TypeScript", "React", "Next.js", "Node.js", "TailwindCSS", "Git"];

  const printableHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${profile.name} - Resume (Tailored for ${company.name})</title>
  <style>
    @page { size: letter; margin: 16mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.4; margin: 0; padding: 24px; font-size: 13px; }
    h1 { margin: 0 0 4px 0; font-size: 24px; color: #0f172a; }
    .subtitle { color: #64748b; font-size: 13px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .section-title { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #2563eb; margin: 14px 0 6px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; }
    .project { margin-bottom: 10px; }
    .project-header { display: flex; justify-content: space-between; font-weight: 600; color: #0f172a; }
    .project-tech { font-size: 11px; color: #64748b; margin-bottom: 3px; }
    ul { margin: 4px 0 0 16px; padding: 0; }
    li { margin-bottom: 3px; }
    .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 4px; margin-bottom: 4px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
    <div><strong>Tailored for ${company.name}</strong> • Click print to save as clean 1-page PDF</div>
    <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: 600; cursor: pointer;">Print / Save PDF</button>
  </div>

  <h1>${profile.name}</h1>
  <div class="subtitle">${profile.title} • ${profile.degreeOrStatus} ${profile.githubUsername ? `• github.com/${profile.githubUsername}` : ""}</div>

  <div class="section-title">Target Match • ${company.name}</div>
  <p style="margin: 4px 0;">Technical builder with hands-on experience in high-performance web systems. Relevant experience matching ${company.name}'s architecture in ${company.whatTheyMake.slice(0, 100)}.</p>

  <div class="section-title">Featured Projects</div>
  ${topProjects
    .map(
      (p) => `
    <div class="project">
      <div class="project-header">
        <span>${p.name}</span>
        <span style="font-size: 11px; color: #64748b;">${p.liveUrl || p.repoUrl || ""}</span>
      </div>
      <div class="project-tech">${p.tech.join(" • ")}</div>
      <ul>
        <li>${p.description}</li>
        <li><strong>Result:</strong> ${p.result}</li>
      </ul>
    </div>
  `
    )
    .join("")}

  <div class="section-title">Technical Skills</div>
  <div style="margin-top: 6px;">
    ${skills.map((s) => `<span class="badge">${s}</span>`).join(" ")}
  </div>

  <div class="section-title">Education</div>
  <p style="margin: 4px 0;">${(profile.resume?.education || [])[0] || profile.degreeOrStatus}</p>
</body>
</html>
  `;

  return {
    tailoredSummary: `Tailored for ${company.name}: highlights experience building ${topProjects[0]?.name || "web applications"} and systems relevant to ${company.domain}.`,
    prioritizedSkills: skills,
    tailoredProjects: topProjects.map((p) => ({
      name: p.name,
      bullets: [p.description, p.result],
    })),
    printableHtml,
  };
}
