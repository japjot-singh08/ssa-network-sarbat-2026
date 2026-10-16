import { getActor, demoMode, fail } from "@/lib/auth";
import { readState } from "@/lib/store";
import { visibleState } from "@/lib/domain";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const actor = await getActor();
    return Response.json(
      {
        ...visibleState(await readState(), actor),
        actor,
        demo: demoMode(),
        aiConfigured: !!process.env.ANTHROPIC_API_KEY,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return fail(e, 503);
  }
}
