import { body, fail, getActor, limit, sameOrigin } from "@/lib/auth";
import { transaction } from "@/lib/store";
import { applyPortal, portalActionSchema } from "@/lib/membership";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const actor = await getActor();
    if (actor.id === "guest")
      throw new Error(
        "Sign in with a verified university account to continue.",
      );
    limit(actor.id);
    const action = portalActionSchema.parse(await body(req));
    const message = await transaction((s) => applyPortal(s, actor, action));
    return Response.json({ message });
  } catch (e) {
    return fail(e);
  }
}
