import type { Challenge } from "./types";
// Fictional rehearsal opportunities, never actual organization requests.
export function arenaDemoChallenges(): Challenge[] {
  const rows: [string, string, string, string, number | null, string][] = [
    [
      "national-food-drive",
      "Run a Campus Food Drive",
      "National",
      "Community Seva",
      null,
      "Collect 30 shelf-stable food items and coordinate delivery with a community pantry.",
    ],
    [
      "national-awareness",
      "Host a Sikh Awareness Table",
      "National",
      "Sikh Awareness",
      null,
      "Host a one-hour information table with a short introduction to Sikhi and space for respectful questions.",
    ],
    [
      "national-handover",
      "Create an Officer Handover Guide",
      "National",
      "Leadership",
      null,
      "Write a reusable handover checklist covering responsibilities, event lessons, and next-semester priorities.",
    ],
    [
      "national-study",
      "Organize a Sangat Study Session",
      "National",
      "Education",
      null,
      "Hold an accessible study session and share a short reflection on member participation.",
    ],
    [
      "west-langar",
      "Serve Langar on Campus",
      "West",
      "Community Seva",
      null,
      "Coordinate a campus-approved langar event with volunteers, food handling arrangements, and an educational introduction.",
    ],
    [
      "west-cleanup",
      "Clean Up a Seattle Community Park",
      "West",
      "Community Seva",
      3,
      "Join a fictional park partner for a litter cleanup. Up to three chapters can claim a place.",
    ],
    [
      "west-website",
      "Build a Pantry Volunteer Webpage",
      "West",
      "Technology",
      1,
      "Build one accessible volunteer information page for a fictional community pantry. One chapter owns this deliverable.",
    ],
    [
      "southeast-kits",
      "Pack 20 Hygiene Kits in Charlotte",
      "Southeast",
      "Community Seva",
      null,
      "Assemble 20 sealed hygiene kits based on a fictional shelter wish list and document handoff.",
    ],
    [
      "southeast-tutoring",
      "Host a Peer Tutoring Workshop",
      "Southeast",
      "Education",
      2,
      "Prepare a two-hour peer tutoring session with a partner campus. Two chapter places are available.",
    ],
    [
      "southeast-collab",
      "Plan a Joint SSA Seva Day",
      "Southeast",
      "Interchapter Collaboration",
      null,
      "Plan and complete a service activity with another chapter and write a shared reflection.",
    ],
    [
      "midwest-coats",
      "Organize a Winter Coat Collection",
      "Midwest",
      "Community Seva",
      null,
      "Collect ten clean coats and confirm a community partner can accept them.",
    ],
    [
      "midwest-budget",
      "Run an Event Budget Workshop",
      "Midwest",
      "Leadership",
      null,
      "Teach a short workshop using a fictional budget and record three planning lessons.",
    ],
    [
      "midwest-flyer",
      "Design a Food Pantry Information Flyer",
      "Midwest",
      "Technology",
      1,
      "Create one accessible print and digital flyer for a fictional pantry. Only one chapter is needed.",
    ],
    [
      "northeast-care",
      "Pack Community Care Packages",
      "Northeast",
      "Community Seva",
      null,
      "Prepare 15 care packages using a fictional partner-approved supply list.",
    ],
    [
      "northeast-dialogue",
      "Host an Interfaith Conversation",
      "Northeast",
      "Sikh Awareness",
      2,
      "Coordinate a moderated campus conversation with two chapter teams and a respectful discussion outline.",
    ],
    [
      "northeast-careers",
      "Organize a Resume Review Session",
      "Northeast",
      "Education",
      null,
      "Hold a resume review session using consent-based participation and anonymized impact notes.",
    ],
    [
      "southwest-garden",
      "Volunteer at a Community Garden",
      "Southwest",
      "Community Seva",
      3,
      "Coordinate a garden workday with a fictional host and record tasks completed.",
    ],
    [
      "southwest-digital",
      "Teach Everyday Digital Skills",
      "Southwest",
      "Technology",
      null,
      "Offer a beginner workshop on safe browsing and everyday tools using fictional practice data.",
    ],
    [
      "southwest-drive",
      "Create a Donation Drive Signup Page",
      "Southwest",
      "Technology",
      1,
      "Build one signup page for a fictional donation drive with accessibility and privacy in mind.",
    ],
  ];
  return rows.map(
    ([id, title, region, category, maxChapters, description], i) => ({
      id: "demo-" + id,
      title,
      region,
      category,
      maxChapters,
      restrictRegion: region !== "National",
      sample: true,
      description: "Fictional demo scenario. " + description,
      organization:
        region === "National"
          ? "USM National Initiative · Fictional demo"
          : `${region} Community Partner · Fictional demo`,
      type: region === "National" ? "National Challenge" : "Community Request",
      location:
        region === "National"
          ? "Any campus"
          : region === "West"
            ? "Seattle / West region"
            : region === "Southeast"
              ? "Charlotte / Southeast region"
              : region === "Midwest"
                ? "Midwest campuses"
                : region === "Northeast"
                  ? "Northeast campuses"
                  : "Southwest campuses",
      deadline: "2026-12-15",
      volunteers: 5,
      points: 100 + (i % 4) * 25,
      grant: 0,
      grantEligibility: "No grant offered in this rehearsal scenario.",
      eligibility:
        region === "National"
          ? "Any SSA chapter. Arrange any necessary campus and host permissions."
          : `${region} SSA chapters. Arrange host and campus permissions before starting.`,
      completion:
        description +
        " Provide a factual summary, anonymized impact, and evidence of the finished activity. Human reviewer approval is required.",
      instructions:
        "Submit a short work summary, impact description, participant count, total volunteer-hours, and a reviewer-accessible evidence link or detailed supporting text. Keep personal recipient information out of evidence.",
      status: "OPEN",
      skills: [category],
      lat: null,
      lng: null,
      createdAt: "2026-10-17T00:00:00.000Z",
    }),
  );
}
