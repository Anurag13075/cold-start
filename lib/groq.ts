// Server-side GroqCloud integration for Cold Start
// Strictly adheres to GroqCloud specs:
// - Base URL: https://api.groq.com/openai/v1
// - Models: openai/gpt-oss-120b (high quality drafting) and openai/gpt-oss-20b (fast)
// - Handles reasoning <think> blocks, markdown fences, and 429 rate limits

export interface GenerateDraftsInput {
  companyName: string;
  domain: string;
  tagline: string;
  sources: Array<{ title: string; category: string; snippet: string }>;
  voiceNote: string;
  userProfile: {
    name: string;
    degreeOrStatus: string;
    activeProject: string;
    projectDescription: string;
  };
}

export function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  // Strip reasoning blocks if model emitted <think>...</think>
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Strip markdown code fences (```json ... ```)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  // Find opening { and closing }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

export async function callGroqChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  modelId: "openai/gpt-oss-120b" | "openai/gpt-oss-20b" = "openai/gpt-oss-120b",
  retries = 2
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("GROQ_API_KEY is not configured in .env.local");
  }

  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages, 
          temperature: 0.3,
          max_tokens: 1500,
          response_format: { type: "json_object" },
        }),
      });

      if (response.status === 429) {
        if (attempt < retries) {
          const delay = (attempt + 1) * 1200;
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }
        throw new Error("Groq API rate limit reached. Please wait a few seconds and retry.");
      }

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errorData}`);
      }
      

      const data = await response.json();
      const rawText = data?.choices?.[0]?.message?.content || "";
      return cleanJsonOutput(rawText);
    } catch (err: any) {
      if (attempt === retries) throw err;
      await new Promise((res) => setTimeout(res, 1000));
    }
  }

  throw new Error("Failed to communicate with GroqCloud.");
}
