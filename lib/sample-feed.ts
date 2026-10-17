import type { Post } from "./types";
export const sampleFeedPosts: Post[] = [
  {
    id: "sample-feed-care",
    chapterId: "uncc",
    submissionId: null,
    title: "A Saturday of seva, one care kit at a time",
    description:
      "Fictional demo recap: our sample SSA spent Saturday packing care kits together. Small teams sorted toiletries, checked the packing list, and wrote encouraging notes. Our favorite lesson: ask the community partner what is needed before collecting supplies. Next time we would set up labeled stations earlier. AI-generated image; no real event or verified impact is represented.",
    category: "Community Seva",
    verified: false,
    status: "PUBLISHED",
    moderation: "Clearly labeled fictional demonstration content.",
    createdAt: "2026-10-17T01:00:00.000Z",
    sample: true,
    imageUrl: "/demo/care-kits-ai.png",
  },
  {
    id: "sample-feed-study",
    chapterId: "ncsu",
    submissionId: null,
    title: "Midterm study circle: learning together",
    description:
      "Fictional demo recap: we turned a midterm weekend into a study circle with snacks, peer support, and space to ask questions. Students swapped study tips and helped each other work through difficult topics. We would love to make this a regular gathering. AI-generated image; this is an illustrative story, not a claim about an actual chapter event.",
    category: "Education",
    verified: false,
    status: "PUBLISHED",
    moderation: "Clearly labeled fictional demonstration content.",
    createdAt: "2026-10-16T18:00:00.000Z",
    sample: true,
    imageUrl: "/demo/study-circle-ai.png",
  },
  {
    id: "sample-feed-collaboration",
    chapterId: "uncc",
    submissionId: null,
    title: "Two chapters, one shared weekend of seva",
    description:
      "Fictional demo recap: two sample SSAs teamed up for a care-kit afternoon and shared what worked at their campuses. A shared supply checklist made setup easier, and pairing new volunteers with experienced ones kept everyone involved. Our takeaway: collaboration starts with a small, clear task. AI-generated image reused for this fictional example; no real partnership is asserted.",
    category: "Interchapter Collaboration",
    verified: false,
    status: "PUBLISHED",
    moderation: "Clearly labeled fictional demonstration content.",
    createdAt: "2026-10-15T18:00:00.000Z",
    sample: true,
    imageUrl: "/demo/care-kits-ai.png",
  },
];
