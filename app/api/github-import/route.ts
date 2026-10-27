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

    const cleanUsername = username.trim().replace(/^@/, "");

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

    if (!Array.isArray(repos)) {
      return NextResponse.json({ repos: [] });
    }

    // Format into clean ProjectItems
    const projects = repos
      .filter((r: any) => !r.fork) // Prioritize original creations
      .slice(0, 15)
      .map((r: any) => {
        const techList: string[] = [];
        if (r.language) techList.push(r.language);
        if (Array.isArray(r.topics)) {
          techList.push(...r.topics.slice(0, 4));
        }

        return {
          id: r.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          name: r.name,
          description: r.description || "Open-source software project built by user.",
          result: r.stargazers_count > 0 
            ? `${r.stargazers_count} GitHub stars, active open source repo`
            : "Production-ready open-source codebase",
          tech: Array.from(new Set(techList)),
          liveUrl: r.homepage || "",
          repoUrl: r.html_url || "",
          images: [],
          isShowcase: r.stargazers_count > 5,
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
