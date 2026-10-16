import { getActor, demoMode, fail } from "@/lib/auth";
import { readState } from "@/lib/store";
import { visibleState } from "@/lib/domain";
import { portalVisible } from "@/lib/membership";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const actor = await getActor();
    const state = await readState();
    return Response.json(
      {
        ...visibleState(state, actor),
        ...portalVisible(state, actor),
        sampleData: state.chapters.some((c) => c.isSample !== false),
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
