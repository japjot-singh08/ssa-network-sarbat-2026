export const maxDuration = 60;
import { z } from "zod";
import { body, fail, getActor, limit, sameOrigin } from "@/lib/auth";
import { screenCommunity } from "@/lib/community";
import { readState } from "@/lib/store";
import { answerQuestion } from "@/lib/assistant";
const schema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("chat"),
    question: z.string().trim().min(3).max(4000),
  }),
  z.object({
    mode: z.literal("extract"),
    message: z.string().trim().min(3).max(12000),
  }),
]);
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const actor = await getActor();
    if (actor.id === "guest")
      throw new Error("Choose a demo identity or sign in to use Sahayak.");
    limit("ai:" + actor.id, 8);
    const input = schema.parse(await body(req));
    if (input.mode === "extract") {
      if (actor.role !== "ADMIN")
        throw new Error("USM reviewer access required.");
      const extraction = await screenCommunity(input.message);
      return Response.json({ extraction });
    }
    return Response.json(
      await answerQuestion(await readState(), input.question),
    );
  } catch (e) {
    return fail(e);
  }
}
