import { NextRequest, NextResponse } from "next/server";
import { callGroqChat } from "@/lib/groq";
import { ResumeData } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Resume text content is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert resume parser for technical engineering profiles.
Extract the structured data from the resume text into a strict JSON object.
Rules:
- Do not invent any facts, dates, or experiences.
- Extract only what is explicitly written in the resume text.
- If a section is missing, return an empty array for that field.

JSON schema:
{
  "education": string[],
  "skills": string[],
  "experience": [
    {
      "role": string,
      "company": string,
      "period": string,
      "bullets": string[]
    }
  ],
  "links": string[]
}`;

    const userPrompt = `Here is the resume text to parse:\n\n${text.slice(0, 8000)}`;

    let parsedResume: ResumeData = {
      education: [],
      skills: [],
      experience: [],
      links: [],
    };

    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith("gsk_")) {
      try {
        const rawJson = await callGroqChat(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          "openai/gpt-oss-20b"
        );
        parsedResume = JSON.parse(rawJson);
      } catch (err: any) {
        console.error("Groq resume parse error:", err);
        // Basic heuristic fallback if LLM is unavailable
        parsedResume = heuristicResumeParse(text);
      }
    } else {
      parsedResume = heuristicResumeParse(text);
    }

    return NextResponse.json({ resume: parsedResume });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to parse resume" },
      { status: 500 }
    );
  }
}


function heuristicResumeParse(rawText: string): ResumeData {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const links: string[] = [];
  const skills: string[] = [];
  const education: string[] = [];


  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const foundUrls = rawText.match(urlRegex) || [];
  links.push(...foundUrls);

  // Common tech keywords
  const techKeywords = [
    "TypeScript", "JavaScript", "Python", "Rust", "Go", "C++", "React", "Next.js",
    "Node.js", "Docker", "PostgreSQL", "MongoDB", "Redis", "TailwindCSS", "AWS", "Git"
  ];
  for (const tech of techKeywords) {
    if (new RegExp(`\\b${tech}\\b`, "i").test(rawText)) {
      skills.push(tech);
    }
  }

  // Find college / degree lines
  for (const line of lines) {
    if (/(bachelor|master|b\.tech|b\.s\.|university|institute|college|degree)/i.test(line)) {
      education.push(line);
      if (education.length >= 2) break;
    }
  }

  return {
    education,
    skills,
    experience: [],
    links: Array.from(new Set(links)),
  };
}
