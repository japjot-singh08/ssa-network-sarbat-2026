import roster from "./usm-directory.json";
import { universityKey } from "./membership";
import type { State } from "./types";
export function importPublicDirectory(s: State) {
  let imported = 0;
  for (const record of roster) {
    const aliases: Record<string, string> = {
      "University of Washington": "uw",
      "Stanford University": "stanford",
      "UC Berkeley": "berkeley",
    };
    const existing = s.chapters.find(
      (c) =>
        c.id === record.id ||
        c.id === aliases[record.university] ||
        (c.isSample === false &&
          c.networkStatus !== "UNCLAIMED" &&
          universityKey(c.university) === universityKey(record.university)),
    );
    // Never overwrite an approved chapter or its officer-owned profile.
    if (
      existing &&
      ((existing.networkStatus === "USM_AFFILIATED" &&
        existing.isSample === false) ||
        s.memberships.some(
          (m) => m.chapterId === existing.id && m.role === "OFFICER",
        ))
    )
      continue;
    const { sourceUrl, ...fields } = record;
    const chapter = {
      ...fields,
      id: existing?.id || record.id,
      size: 0,
      skills: [],
      experience: [],
      availability: null,
      commitments: null,
      publicContact: null,
      logoUrl: null,
      applicationsOpen: false,
      isSample: false,
      networkStatus: "UNCLAIMED",
      universityRecognition: "NOT_CONFIRMED",
      onboarding: [],
      bio: `Listed in USM’s public SSA directory. Executive-board ownership has not been verified in SSA Network. Source: ${sourceUrl}`,
    };
    if (existing) Object.assign(existing, chapter);
    else s.chapters.push(chapter);
    imported++;
  }
  return imported;
}
