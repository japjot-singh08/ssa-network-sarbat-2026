import { z } from "zod";
import {
  categories,
  resourceCategories,
  type Actor,
  type State,
  type Submission,
  type Challenge,
  type Chapter,
} from "./types";
const text = (max = 4000) => z.string().trim().min(1).max(max);
const id = text(100);
const web = z
  .string()
  .url()
  .max(2000)
  .refine((v) => /^https?:\/\//i.test(v), "Use an http or https link");
export const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("accept"), challengeId: id }),
  z.object({ action: z.literal("interest"), challengeId: id }),
  z.object({
    action: z.literal("submit"),
    participationId: id,
    summary: text(),
    impact: text(),
    evidence: text(6000),
    attachment: z.union([web, z.literal("")]).optional(),
    participants: z.number().int().min(1).max(1000),
    hours: z.number().min(0.5).max(10000),
  }),
  z.object({
    action: z.literal("review"),
    submissionId: id,
    decision: z.enum(["APPROVED", "REJECTED", "NEEDS_INFO"]),
    feedback: text(2000),
    verifiedHours: z.number().min(0).max(10000),
    grantApproved: z.boolean(),
  }),
  z.object({ action: z.literal("react"), postId: id }),
  z.object({
    action: z.literal("post"),
    title: text(150),
    description: text(),
    category: z.enum(categories),
  }),
  z.object({
    action: z.literal("moderate"),
    postId: id,
    publish: z.boolean(),
    feedback: text(2000),
  }),
  z.object({
    action: z.literal("publish"),
    title: text(150),
    description: text(),
    organization: text(200),
    type: z.enum(["Community Request", "National Challenge"]),
    category: z.enum(categories),
    location: text(200),
    region: z.enum([
      "West",
      "Southeast",
      "Midwest",
      "Northeast",
      "Southwest",
      "National",
    ]),
    deadline: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((v) => !isNaN(Date.parse(v))),
    volunteers: z.number().int().min(1).max(10000).nullable(),
    points: z.number().int().min(1).max(1000),
    grant: z.number().min(0).max(10000),
    eligibility: text(),
    grantEligibility: text(),
    completion: text(),
    instructions: text(),
  }),
  z.object({
    action: z.literal("import"),
    title: text(200),
    description: text(),
    category: z.enum(resourceCategories),
    source: text(500),
    url: web.optional().or(z.literal("")),
    content: text(60000),
    approvedForPublic: z.literal(true),
  }),
  z.object({
    action: z.literal("chapter"),
    bio: text(2000),
    size: z.number().int().min(1).max(1000),
    availability: text(300).nullable(),
  }),
]);
export type Action = z.infer<typeof actionSchema>;
export const SCORING = {
  effortHours: 20,
  effortWeight: 0.25,
  referenceSize: 40,
  minSizeMultiplier: 0.8,
  maxSizeMultiplier: 1.2,
};
export function score(base: number, hours: number, size: number) {
  const effort =
    1 +
    SCORING.effortWeight *
      Math.min(Math.max(hours, 0) / SCORING.effortHours, 1);
  const normalization = Math.min(
    SCORING.maxSizeMultiplier,
    Math.max(
      SCORING.minSizeMultiplier,
      Math.sqrt(SCORING.referenceSize / Math.max(size, 1)),
    ),
  );
  return Math.round(base * effort * normalization);
}
export function semester(date: string) {
  const d = new Date(date);
  return `${d.getUTCMonth() < 7 ? "Spring" : "Fall"} ${d.getUTCFullYear()}`;
}
function need(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
export function apply(state: State, actor: Actor, action: Action) {
  const now = new Date().toISOString(),
    uid = () => crypto.randomUUID();
  const admin = () =>
    need(actor.role === "ADMIN", "USM reviewer access required.");
  const officer = () =>
    need(
      actor.role === "OFFICER" && actor.chapterId,
      "Chapter officer access required.",
    );
  if (action.action === "accept" || action.action === "interest") {
    const c = state.challenges.find((c) => c.id === action.challengeId);
    need(c && c.status === "OPEN", "Challenge is not open.");
    need(
      !c.deadline || c.deadline >= now.slice(0, 10),
      "Challenge deadline has passed.",
    );
    if (action.action === "interest") {
      if (
        !state.interests.some(
          (i) => i.userId === actor.id && i.challengeId === c.id,
        )
      )
        state.interests.push({
          id: uid(),
          userId: actor.id,
          challengeId: c.id,
        });
      return "Interest saved.";
    }
    officer();
    if (
      !state.participations.some(
        (p) => p.chapterId === actor.chapterId && p.challengeId === c.id,
      )
    )
      state.participations.push({
        id: uid(),
        chapterId: actor.chapterId!,
        challengeId: c.id,
        createdAt: now,
      });
    return "Challenge added to My Challenges.";
  }
  if (action.action === "submit") {
    officer();
    const p = state.participations.find((p) => p.id === action.participationId);
    need(
      p?.chapterId === actor.chapterId,
      "This participation belongs to another chapter.",
    );
    const previous = state.submissions.find((s) => s.participationId === p.id);
    need(
      !previous || ["NEEDS_INFO", "REJECTED"].includes(previous.status),
      "A submission is already pending or approved.",
    );
    if (previous) {
      Object.assign(previous, action, {
        status: "PENDING",
        feedback: "",
        reviewerId: null,
        verifiedHours: null,
        createdAt: now,
      });
      delete (previous as unknown as Record<string, unknown>).action;
    } else
      state.submissions.push({
        id: uid(),
        participationId: p.id,
        summary: action.summary,
        impact: action.impact,
        evidence: action.evidence,
        attachment: action.attachment || null,
        participants: action.participants,
        hours: action.hours,
        status: "PENDING",
        feedback: "",
        reviewerId: null,
        verifiedHours: null,
        createdAt: now,
      });
    return "Evidence submitted. A human USM reviewer will review it.";
  }
  if (action.action === "review") {
    admin();
    const s = state.submissions.find((s) => s.id === action.submissionId);
    need(s, "Submission not found.");
    if (s.status === "APPROVED" && action.decision === "APPROVED")
      return "Already approved; no duplicate awards created.";
    need(s.status === "PENDING", "Only pending submissions can be reviewed.");
    need(
      action.verifiedHours <= s.hours,
      "Verified effort cannot exceed submitted effort.",
    );
    const p = state.participations.find((p) => p.id === s.participationId)!;
    const c = state.challenges.find((c) => c.id === p.challengeId)!;
    const chapter = state.chapters.find((c) => c.id === p.chapterId)!;
    s.status = action.decision;
    s.feedback = action.feedback;
    s.reviewerId = actor.id;
    s.verifiedHours = action.verifiedHours;
    if (s.status === "APPROVED") {
      if (!state.points.some((t) => t.submissionId === s.id))
        state.points.push({
          id: uid(),
          chapterId: p.chapterId,
          submissionId: s.id,
          amount: score(c.points, action.verifiedHours, chapter.size),
          semester: semester(now),
          createdAt: now,
        });
      if (
        c.grant > 0 &&
        action.grantApproved &&
        !state.grants.some((t) => t.submissionId === s.id)
      )
        state.grants.push({
          id: uid(),
          chapterId: p.chapterId,
          submissionId: s.id,
          amount: c.grant,
          createdAt: now,
        });
      if (!state.posts.some((post) => post.submissionId === s.id))
        state.posts.push({
          id: uid(),
          chapterId: p.chapterId,
          submissionId: s.id,
          title: c.title,
          description: `${chapter.name} completed “${c.title}”. A USM reviewer verified ${action.verifiedHours} total volunteer-hours. ${state.points.find((t) => t.submissionId === s.id)!.amount} recognition points awarded.`,
          category: c.category,
          verified: true,
          status: "PUBLISHED",
          moderation: "Human-approved achievement; factual template.",
          createdAt: now,
        });
    }
    return s.status === "APPROVED"
      ? "Approved. Points, grant record (if selected), and verified post saved together."
      : "Review feedback saved.";
  }
  if (action.action === "react") {
    need(
      state.posts.some(
        (p) => p.id === action.postId && p.status === "PUBLISHED",
      ),
      "Post not found.",
    );
    const existing = state.reactions.find(
      (r) => r.userId === actor.id && r.postId === action.postId,
    );
    if (existing)
      state.reactions = state.reactions.filter((r) => r.id !== existing.id);
    else
      state.reactions.push({
        id: uid(),
        userId: actor.id,
        postId: action.postId,
      });
    return existing ? "Shabash removed." : "Shabash!";
  }
  if (action.action === "post") {
    officer();
    state.posts.push({
      id: uid(),
      chapterId: actor.chapterId!,
      submissionId: null,
      title: action.title,
      description: action.description,
      category: action.category,
      verified: false,
      status: "PENDING",
      moderation: "Awaiting caption screening and human review.",
      createdAt: now,
    });
    return "Proposed post saved for moderation.";
  }
  if (action.action === "moderate") {
    admin();
    const p = state.posts.find((p) => p.id === action.postId);
    need(
      p && !p.verified && p.status !== "PUBLISHED",
      "Proposed post not found.",
    );
    p.status = action.publish ? "PUBLISHED" : "REJECTED";
    p.moderation = action.feedback;
    return "Moderation decision saved.";
  }
  if (action.action === "publish") {
    admin();
    const { action: _, ...fields } = action;
    void _;
    state.challenges.push({
      ...fields,
      id: uid(),
      skills: [action.category],
      lat: null,
      lng: null,
      status: "OPEN",
      createdAt: now,
    });
    return "Challenge published after reviewer confirmation.";
  }
  if (action.action === "import") {
    admin();
    state.documents.push({
      id: uid(),
      title: action.title,
      description: action.description,
      category: action.category,
      source: action.source,
      url: action.url || null,
      updatedAt: now.slice(0, 10),
      content: action.content,
      sample: false,
    });
    return "Approved public resource imported.";
  }
  if (action.action === "chapter") {
    officer();
    const c = state.chapters.find((c) => c.id === actor.chapterId)!;
    c.bio = action.bio;
    c.size = action.size;
    c.availability = action.availability;
    return "Chapter information saved.";
  }
}
export function visibleState(state: State, actor: Actor): State {
  return {
    ...state,
    profiles: [],
    submissions: state.submissions.filter(
      (s) =>
        actor.role === "ADMIN" ||
        state.participations.some(
          (p) => p.id === s.participationId && p.chapterId === actor.chapterId,
        ),
    ),
    posts: state.posts.filter(
      (p) =>
        p.status === "PUBLISHED" ||
        actor.role === "ADMIN" ||
        p.chapterId === actor.chapterId,
    ),
    interests: state.interests.filter((i) => i.userId === actor.id),
    reactions: state.reactions.map((r) => ({
      ...r,
      userId: r.userId === actor.id ? actor.id : "anonymous",
    })),
  };
}
export function retrieve(state: State, question: string) {
  const terms = [
    ...new Set(question.toLowerCase().match(/[a-z]{3,}/g) || []),
  ].filter(
    (t) =>
      ![
        "the",
        "how",
        "can",
        "our",
        "what",
        "with",
        "for",
        "you",
        "and",
      ].includes(t),
  );
  return state.documents
    .map((d) => ({
      document: d,
      score: terms.reduce(
        (n, t) =>
          n +
          (d.title.toLowerCase().includes(t) ? 4 : 0) +
          (d.content.toLowerCase().includes(t) ? 1 : 0),
        0,
      ),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.document);
}
export function matching(c: Challenge, chapters: Chapter[]) {
  return chapters
    .map((ch) => {
      let points = 0;
      const reasons: string[] = [];
      if (
        c.lat !== null &&
        c.lng !== null &&
        ch.lat !== null &&
        ch.lng !== null
      ) {
        const rad = (d: number) => (d * Math.PI) / 180;
        const a =
          Math.sin(rad(ch.lat - c.lat) / 2) ** 2 +
          Math.cos(rad(c.lat)) *
            Math.cos(rad(ch.lat)) *
            Math.sin(rad(ch.lng - c.lng) / 2) ** 2;
        const km = Math.round(
          6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
        );
        points += Math.max(0, 40 - km / 10);
        reasons.push(`${km} km approximate straight-line distance`);
      } else reasons.push("Distance unknown: project coordinates unavailable");
      if (ch.region === c.region || c.region === "National") {
        points += 20;
        reasons.push(
          c.region === "National" ? "Eligible nationwide" : "Same region",
        );
      }
      const skills = ch.skills.filter((s) => c.skills.includes(s));
      points += skills.length * 10;
      reasons.push(
        skills.length
          ? `Relevant experience: ${skills.join(", ")}`
          : "Relevant skills: no recorded match",
      );
      if (ch.experience.includes(c.category)) {
        points += 10;
        reasons.push("Previous seva experience in this category");
      }
      reasons.push(
        ch.availability
          ? `Availability: ${ch.availability}`
          : "Availability unknown",
      );
      reasons.push(
        ch.commitments === null
          ? "Calendar and exams unknown"
          : ch.commitments.length
            ? "Recorded commitments: " + ch.commitments.join(", ")
            : "No recorded scheduling conflict (calendar may be incomplete)",
      );
      return { chapter: ch, score: Math.round(points), reasons };
    })
    .sort((a, b) => b.score - a.score);
}
export function submissionContext(state: State, s: Submission) {
  const p = state.participations.find((p) => p.id === s.participationId)!;
  return {
    challenge: state.challenges.find((c) => c.id === p.challengeId)!,
    chapter: state.chapters.find((c) => c.id === p.chapterId)!,
  };
}
