import type { Post } from "./types";
export const sampleFeedPosts: Post[] = [
  {
    id: "sample-feed-care",
    chapterId: "uncc",
    submissionId: null,
    title: "Demo: A care-kit packing afternoon",
    description:
      "Fictional example: chapter members plan a care-kit packing afternoon with a community partner. A useful recap explains what was done, what the partner confirmed, and what the next team can improve. This sample does not represent an actual event or verified outcome.",
    category: "Community Seva",
    verified: false,
    status: "PUBLISHED",
    moderation: "Clearly labeled fictional demonstration content.",
    createdAt: "2026-10-17T01:00:00.000Z",
    sample: true,
    imageUrl: "/demo/care-kits.svg",
  },
  {
    id: "sample-feed-study",
    chapterId: "ncsu",
    submissionId: null,
    title: "Demo: Students teaching students",
    description:
      "Fictional example: an SSA hosts a welcoming study and discussion circle. Share the event purpose, useful lessons, and an invitation for the next session—without exposing attendees’ private information. This is sample content, not a claim about this university’s SSA.",
    category: "Education",
    verified: false,
    status: "PUBLISHED",
    moderation: "Clearly labeled fictional demonstration content.",
    createdAt: "2026-10-16T18:00:00.000Z",
    sample: true,
    imageUrl: "/demo/study-circle.svg",
  },
  {
    id: "sample-feed-collaboration",
    chapterId: "uncc",
    submissionId: null,
    title: "Demo: Plan a shared seva day",
    description:
      "Fictional example: two chapters compare volunteer availability and plan a joint service project. An interchapter post can celebrate collaboration and share a reusable checklist. No real chapter partnership, completed project, or impact is asserted here.",
    category: "Interchapter Collaboration",
    verified: false,
    status: "PUBLISHED",
    moderation: "Clearly labeled fictional demonstration content.",
    createdAt: "2026-10-15T18:00:00.000Z",
    sample: true,
    imageUrl: "/demo/campus-seva.svg",
  },
];
