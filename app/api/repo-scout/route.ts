import { NextRequest, NextResponse } from "next/server";
import { RepoIssue } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { githubUrl, companyDomain, userSkills } = await req.json();

    if (!githubUrl && !companyDomain) {
      return NextResponse.json({ issues: [] });
    }

    let orgName = "";
    if (githubUrl) {
      const match = githubUrl.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
      if (match) orgName = match[1];
    } else if (companyDomain) {
      orgName = companyDomain.split(".")[0];
    }

    if (!orgName) {
      return NextResponse.json({ issues: [] });
    }

    // Search GitHub for open issues in this org labeled "good first issue" or "help wanted"
    const query = `org:${encodeURIComponent(orgName)} is:issue is:open label:"good first issue","help wanted"`;
    const ghRes = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=updated&per_page=10`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ColdStart-App/1.0",
        },
      }
    );

    if (!ghRes.ok) {
      // If search failed (e.g. rate limit or not an org), attempt top repo search
      return NextResponse.json({
        issues: [
          {
            title: `Contribute to ${orgName} open-source repositories`,
            number: 1,
            url: `https://github.com/${orgName}`,
            labels: ["help wanted"],
            matchReason: `Check out their primary repository to submit a small fix or docs PR before emailing.`,
          },
        ],
      });
    }

    const data = await ghRes.json();
    const items = data.items || [];

    const issues: RepoIssue[] = items.slice(0, 5).map((item: any) => {
      const labels = (item.labels || []).map((l: any) => l.name);
      return {
        title: item.title,
        number: item.number,
        url: item.html_url,
        labels,
        matchReason: `Open issue in repo ${item.repository_url?.split("/").pop()} suitable for an introductory PR.`,
      };
    });

    return NextResponse.json({ issues, orgName });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to search repository issues" },
      { status: 500 }
    );
  }
}
