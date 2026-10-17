import type { State } from "./types";
export function verifiedImpact(s: State) {
  const completed = s.submissions.filter(
    (x) =>
      x.status === "APPROVED" &&
      s.participations.some(
        (p) =>
          p.id === x.participationId &&
          s.challenges.some(
            (c) => c.id === p.challengeId && c.sample === false,
          ),
      ),
  );
  return {
    projects: completed.length,
    hours: completed.reduce((n, x) => n + (x.verifiedHours || 0), 0),
    chapters: new Set(
      completed.map(
        (x) =>
          s.participations.find((p) => p.id === x.participationId)!.chapterId,
      ),
    ).size,
  };
}
