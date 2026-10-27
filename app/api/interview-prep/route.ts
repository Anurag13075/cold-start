import { NextRequest, NextResponse } from "next/server";
import { UserProfile, CompanyBrief, InterviewQuestion } from "@/lib/types";
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

    const primaryProject = userProfile.projects[0] || {
      name: "Engineering Project",
      description: "Full stack web application",
      result: "High performance architecture",
      tech: ["TypeScript", "React"],
    };

    const prompt = `You are a Principal Engineering Interviewer at ${companyBrief.name}.
Company context:
- Product: ${companyBrief.whatTheyMake}
- Target users: ${companyBrief.whoItIsFor}
- Recent shipments: ${companyBrief.recentShipped.map((s) => s.title).join(", ")}

Candidate context:
- Name: ${userProfile.name}
- Background: ${userProfile.degreeOrStatus}
- Flagship Project: ${primaryProject.name} (${primaryProject.description}, tech: ${primaryProject.tech.join(", ")}, outcome: ${primaryProject.result})

Generate 5 high-yield, company-specific interview questions that founders or technical leads at ${companyBrief.name} are likely to ask this candidate.
Each question must test how the candidate's actual project experience directly applies to ${companyBrief.name}'s architectural and product challenges.

JSON SCHEMA:
{
  "questions": [
    {
      "id": string,
      "question": string,
      "context": string (why this question matters to ${companyBrief.name}),
      "idealKeyPoints": string[] (3-4 bullet points the candidate must mention for a 10/10 answer)
    }
  ]
}`;

    let questions: InterviewQuestion[] = [];

    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.startsWith("gsk_")) {
      try {
        const rawJson = await callGroqChat(
          [
            { role: "system", content: "You output valid JSON for technical interview preparation." },
            { role: "user", content: prompt },
          ],
          "openai/gpt-oss-20b"
        );
        const parsed = JSON.parse(rawJson);
        if (Array.isArray(parsed.questions)) {
          questions = parsed.questions;
        }
      } catch (err) {
        console.error("Groq interview prep error:", err);
      }
    }

    if (questions.length === 0) {
      questions = [
        {
          id: "q1",
          question: `How does your architecture in ${primaryProject.name} scale when applied to ${companyBrief.name}'s core system?`,
          context: `Founders want to verify that your project work translates to their production scale.`,
          idealKeyPoints: [
            `Explain the bottleneck you encountered in ${primaryProject.name}`,
            `Cite specific metrics (${primaryProject.result})`,
            `Map how you would adapt caching and database indices for ${companyBrief.name}'s workload`,
          ],
        },
        {
          id: "q2",
          question: `We recently shipped ${companyBrief.recentShipped[0]?.title || "new features"}. If you joined tomorrow, what is the first edge-case or failure mode you would test?`,
          context: `Tests whether you actually understand what the company shipped and think like an owner.`,
          idealKeyPoints: [
            `Demonstrate familiarity with recent release details`,
            `Walk through a concrete concurrency or network drop failure scenario`,
            `Propose an automated telemetry test to catch regressions`,
          ],
        },
        {
          id: "q3",
          question: `In ${primaryProject.name}, why did you choose ${primaryProject.tech[0] || "your stack"} over alternatives? What trade-off did that introduce?`,
          context: `Tests technical decision-making and honesty about trade-offs rather than dogmatic choices.`,
          idealKeyPoints: [
            `State the specific constraint that dictated the choice`,
            `Acknowledge at least one genuine downside or limitation you had to mitigate`,
            `Explain how you'd re-evaluate if latency or memory requirements tightened 10x`,
          ],
        },
        {
          id: "q4",
          question: `How do you prioritize between building new features quickly versus refactoring technical debt in an early-stage startup?`,
          context: `Assesses early-stage startup culture fit and pragmatism.`,
          idealKeyPoints: [
            `Bias towards shipping customer-facing value and rapid validation`,
            `Use observability to identify which technical debt causes real user friction`,
            `Set explicit refactoring windows rather than indefinite perfectionism`,
          ],
        },
        {
          id: "q5",
          question: `Walk us through a time when a system you built failed in unexpected conditions. How did you diagnose and resolve it?`,
          context: `Evaluates debugging depth, composure, and root-cause post-mortem rigor.`,
          idealKeyPoints: [
            `Describe symptom vs root cause clearly`,
            `Share the diagnostic steps and tools used`,
            `Detail the preventive guardrail added so the issue never occurs again`,
          ],
        },
      ];
    }

    return NextResponse.json({ questions });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate interview prep" },
      { status: 500 }
    );
  }
}
