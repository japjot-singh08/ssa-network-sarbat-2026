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
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
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

// A forced formatting tool gives Claude a schema without executing any action.
export async function askJSON(
  system: string,
  prompt: string,
  schema: Anthropic.Tool.InputSchema,
) {
  if (!process.env.ANTHROPIC_API_KEY)
    throw new Error(
      "Sahayak is not configured. Add ANTHROPIC_API_KEY to the server environment.",
    );
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 40000,
    maxRetries: 0,
  });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
    max_tokens: 2400,
    system,
    messages: [{ role: "user", content: prompt }],
    tools: [
      {
        name: "format_response",
        description:
          "Return the requested structured response. This formatting tool does not execute an action or publish anything.",
        input_schema: schema,
      },
    ],
    tool_choice: { type: "tool", name: "format_response" },
  });
  const result = response.content.find(
    (b) => b.type === "tool_use" && b.name === "format_response",
  );
  if (
    !result ||
    result.type !== "tool_use" ||
    response.stop_reason === "max_tokens"
  )
    throw new Error(
      "Sahayak could not finish formatting this response. Please try a shorter request.",
    );
  return JSON.stringify(result.input);
}
