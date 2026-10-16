import Anthropic from "@anthropic-ai/sdk";
export async function ask(
  system: string,
  prompt: string,
  suppliedClient?: Anthropic,
) {
  if (!suppliedClient && !process.env.ANTHROPIC_API_KEY)
    throw new Error(
      "Sahayak is not configured. Add ANTHROPIC_API_KEY to the server environment and restart. Your question has not been sent to an AI service.",
    );
  const client =
    suppliedClient ||
    new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 30000,
      maxRetries: 1,
    });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
    max_tokens: 1800,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
export function jsonReply(raw: string): unknown {
  return JSON.parse(raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, ""));
}
