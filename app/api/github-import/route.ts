import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();

    if (!username || typeof username !== "string" || !username.trim()) {
      return NextResponse.json(
        { error: "GitHub username is required" },
        { status: 400 }
      );
    }

    // Clean username from any URL format, @-prefix, or trailing slash
    let cleanUsername = username.trim();
    cleanUsername = cleanUsername.replace(/^https?:\/\//i, "");
    cleanUsername = cleanUsername.replace(/^(?:www\.)?github\.com\//i, "");
    cleanUsername = cleanUsername.replace(/^@/, "");
    cleanUsername = cleanUsername.replace(/\/.*$/, "").trim();

    if (!cleanUsername) {
      return NextResponse.json(
        { error: "Please enter a valid GitHub username" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?sort=updated&per_page=30`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "ColdStart-App/1.0",
        },
        next: { revalidate: 60 },
      }
    );

    if (res.status === 404) {
      return NextResponse.json(
        { error: `GitHub user "${cleanUsername}" not found` },
        { status: 404 }
      );
    }

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `GitHub API error (${res.status}): ${errorText}` },
        { status: res.status }
      );
    }

    const repos = await res.json();

    if (!Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json({ projects: [], username: cleanUsername });
    }

    // Prioritize non-fork repos, but include forks if user only has forks
    let filteredRepos = repos.filter((r: any) => !r.fork);
    if (filteredRepos.length === 0) {
      filteredRepos = repos;
    }

    // Format into clean ProjectItems
    const projects = filteredRepos.slice(0, 20).map((r: any) => {
      const techList: string[] = [];
      if (r.language) techList.push(r.language);
      if (Array.isArray(r.topics)) {
        techList.push(...r.topics.slice(0, 4));
      }

      return {
        id: r.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        name: r.name,
        description: r.description || "Open-source software repository built by user.",
        result:
          r.stargazers_count > 0
            ? `${r.stargazers_count} GitHub star(s), active repository`
            : "Production-ready open-source codebase",
        tech: techList.length > 0 ? Array.from(new Set(techList)) : ["TypeScript", "Code"],
        liveUrl: r.homepage || "",
        repoUrl: r.html_url || "",
        images: [],
        isShowcase: r.stargazers_count > 0,
      };
    });

    return NextResponse.json({ projects, username: cleanUsername });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to import GitHub repositories" },
      { status: 500 }
    );
  }
}
