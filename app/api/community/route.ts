export const maxDuration = 60;
import { z } from "zod";
import { body, fail, getActor, limit, sameOrigin } from "@/lib/auth";
import { readState, transaction } from "@/lib/store";
import { communityInput, screenCommunity } from "@/lib/community";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const input = z.record(z.string(), z.unknown()).parse(await body(req));
    if (input.action === "submit") {
      limit(
        "community:" +
          (req.headers.get("x-forwarded-for")?.split(",")[0] || "local"),
        5,
      );
      const details = communityInput.parse(input);
      const id = crypto.randomUUID();
      await transaction((s) => {
        s.communityRequests.push({
          id,
          details: { ...details, website: details.website || "" },
          assessment: null,
          status: "PENDING",
          reviewNote: "",
          challengeId: null,
          createdAt: new Date().toISOString(),
        });
      });
      return Response.json({
        message:
          "Request received. USM will review the details before publication. Your contact email will remain private.",
        id,
      });
    }
    const actor = await getActor();
    if (actor.role !== "ADMIN")
      throw new Error("USM administrator access required.");
    limit("community-review:" + actor.id, 8);
    const action = z
      .object({
        action: z.enum(["screen", "reject"]),
        id: z.string().min(1),
        note: z.string().max(2000).optional(),
      })
      .parse(input);
    const item = (await readState()).communityRequests.find(
      (r) => r.id === action.id,
    );
    if (!item || item.status !== "PENDING")
      throw new Error("Pending request not found.");
    const assessment =
      action.action === "screen"
        ? await screenCommunity(
            JSON.stringify({
              organization: item.details.organization,
              location: item.details.location,
              message: item.details.message,
            }),
          )
        : null;
    await transaction((s) => {
      const r = s.communityRequests.find((r) => r.id === item.id);
      if (!r || r.status !== "PENDING")
        throw new Error("Request already reviewed.");
      if (assessment) r.assessment = assessment;
      else {
        r.status = "REJECTED";
        r.reviewNote = action.note || "Declined by USM reviewer.";
      }
    });
    return Response.json({
      message: assessment
        ? "AI draft ready. Verify facts and organizer before publishing."
        : "Request declined.",
      assessment,
    });
  } catch (e) {
    return fail(e);
  }
}
