import { test } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { ask } from "../lib/ai";
import { answerQuestion } from "../lib/assistant";
import { seed } from "../lib/seed";
test("RAG supplies retrieved excerpts, preserves valid citations, rejects fabricated IDs", async () => {
  const result = await answerQuestion(
    seed(),
    "How do we organize langar seva?",
    async (system, prompt) => {
      assert.match(system, /advisory/);
      const input = JSON.parse(prompt);
      assert.ok(input.retrieved.some((d: { id: string }) => d.id === "langar"));
      return JSON.stringify({
        answer:
          "Fictional sample guidance: coordinate with the host, assign volunteer roles, and confirm food safety rules.",
        sourceIds: ["langar"],
      });
    },
  );
  assert.equal(result.citations[0].url, "/?view=toolkit&resource=langar");
  assert.equal(result.citations[0].sample, true);
  await assert.rejects(
    answerQuestion(seed(), "langar", async () =>
      JSON.stringify({
        answer: "Unsupported claim",
        sourceIds: ["fabricated-source"],
      }),
    ),
    /invalid citation/,
  );
  const none = await answerQuestion(seed(), "xyzzy", async (_, prompt) => {
    assert.equal(JSON.parse(prompt).retrieved.length, 0);
    return JSON.stringify({
      answer: "No relevant source is available; these are general suggestions.",
      sourceIds: [],
    });
  });
  assert.equal(none.citations.length, 0);
});
test("official Anthropic SDK request contract with mocked transport (no live service)", async () => {
  let sent: Record<string, unknown> | undefined;
  const client = new Anthropic({
    apiKey: "synthetic-test-key-not-real",
    fetch: async (_input, init) => {
      sent = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          id: "msg_test",
          type: "message",
          role: "assistant",
          model: "mock",
          content: [{ type: "text", text: "Test response" }],
          stop_reason: "end_turn",
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 3 },
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    },
  });
  assert.equal(
    await ask("Advisory system", "A test question", client),
    "Test response",
  );
  assert.equal(sent?.system, "Advisory system");
  assert.deepEqual(sent?.messages, [
    { role: "user", content: "A test question" },
  ]);
});
