import { z } from "zod";
import type { Actor, State, Profile } from "./types";
const text = (max = 4000) => z.string().trim().min(1).max(max),
  id = text(100),
  answers = z
    .record(z.string().max(100), z.string().max(4000))
    .refine((v) => Object.keys(v).length <= 20, "Too many answers");
export const membershipQuestions = [
  { key: "preferredName", label: "Preferred name", required: true },
  { key: "academicYear", label: "Academic year", required: true },
  { key: "major", label: "Major (optional)", required: false },
  { key: "motivation", label: "Why would you like to join?", required: true },
  {
    key: "interests",
    label: "Activities you are interested in",
    required: true,
  },
  {
    key: "volunteering",
    label: "Interest in volunteering or leadership",
    required: true,
  },
  {
    key: "additional",
    label: "Additional information (optional)",
    required: false,
  },
];
export const proposalQuestions = [
  { key: "university", label: "University name", required: true },
  {
    key: "location",
    label: "University location (city, state/country)",
    required: true,
  },
  { key: "state", label: "State / province", required: true },
  { key: "region", label: "Region", required: true },
  { key: "proposedName", label: "Proposed SSA name", required: true },
  { key: "reason", label: "Why start this chapter?", required: true },
  { key: "students", label: "Approximate interested students", required: true },
  {
    key: "leadership",
    label: "Do you have an initial leadership team?",
    required: true,
  },
  { key: "goals", label: "Chapter goals", required: true },
  { key: "activities", label: "Planned activities", required: true },
  { key: "support", label: "Support needed from USM", required: true },
  {
    key: "additional",
    label: "Additional comments (optional)",
    required: false,
  },
];
export const portalActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("profile"),
      name: text(100),
      academicYear: z.string().max(100),
      major: z.string().max(200),
    })
    .strict(),
  z.object({
    action: z.literal("membershipApply"),
    chapterId: id,
    answers,
    submit: z.boolean(),
  }),
  z.object({
    action: z.literal("membershipReview"),
    applicationId: id,
    decision: z.enum(["APPROVED", "DECLINED", "CHANGES_REQUESTED"]),
    note: z.string().trim().max(2000),
  }),
  z.object({
    action: z.literal("chapterClaim"),
    chapterId: id,
    position: text(150),
    evidence: text(4000).min(20),
    confirmed: z.literal(true),
  }),
  z.object({
    action: z.literal("chapterPropose"),
    proposalId: id.optional(),
    details: answers,
    submit: z.boolean(),
  }),
  z.object({
    action: z.literal("proposalReview"),
    proposalId: id,
    decision: z.enum(["APPROVED", "DECLINED", "CHANGES_REQUESTED"]),
    note: z.string().trim().max(2000),
  }),
  z.object({
    action: z.literal("chapterProfile"),
    chapterId: id,
    size: z.number().int().min(1).max(1000).optional(),
    bio: text(2000),
    location: text(200),
    state: text(100),
    publicContact: z.email().or(z.literal("")),
    logoUrl: z
      .url()
      .refine((v) => /^https?:\/\//i.test(v))
      .or(z.literal("")),
    applicationsOpen: z.boolean(),
    publicContactConfirmed: z.literal(true),
  }),
  z.object({
    action: z.literal("chapterResource"),
    chapterId: id,
    title: text(200),
    content: text(20000),
    url: z
      .url()
      .refine((v) => /^https?:\/\//i.test(v))
      .or(z.literal("")),
  }),
]);
export type PortalAction = z.infer<typeof portalActionSchema>;
function need(v: unknown, message: string): asserts v {
  if (!v) throw new Error(message);
}
export function manages(s: State, a: Actor, chapterId: string) {
  return (
    (a.role === "OFFICER" && a.chapterId === chapterId) ||
    s.memberships.some(
      (m) =>
        m.userId === a.id &&
        m.chapterId === chapterId &&
        m.role === "OFFICER" &&
        m.status === "ACTIVE",
    )
  );
}
export function universityKey(name: string) {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
export function ensureProfile(s: State, actor: Actor) {
  let p = s.profiles.find((p) => p.id === actor.id);
  if (!p) {
    p = {
      id: actor.id,
      role: "STUDENT",
      chapterId: null,
      name: actor.name || "",
      email: actor.email || "",
      academicYear: "",
      major: "",
    };
    s.profiles.push(p);
  }
  return p;
}
function clean(
  values: Record<string, string>,
  questions: typeof membershipQuestions,
  submit: boolean,
) {
  const data: Record<string, string> = {};
  for (const q of questions) {
    data[q.key] = (values[q.key] || "").trim();
    if (submit && q.required) need(data[q.key], `Complete: ${q.label}`);
  }
  return data;
}
export function applyPortal(s: State, a: Actor, input: PortalAction) {
  need(a.id !== "guest", "Sign in to continue.");
  need(a.verified !== false, "Verify your email first.");
  const now = new Date().toISOString(),
    uid = () => crypto.randomUUID();
  const audit = (action: string, targetId: string, chapterId: string | null) =>
    s.auditLogs.push({
      id: uid(),
      actorId: a.id,
      action,
      targetId,
      chapterId,
      createdAt: now,
    });
  if (input.action === "profile") {
    const p = ensureProfile(s, a);
    Object.assign(p, {
      name: input.name,
      academicYear: input.academicYear,
      major: input.major,
    });
    return "Profile updated.";
  }
  if (input.action === "chapterClaim") {
    const c = s.chapters.find((c) => c.id === input.chapterId);
    need(
      c && c.networkStatus === "UNCLAIMED",
      "This chapter is already claimed or is not available for claims.",
    );
    const profile = ensureProfile(s, a);
    const existing = s.chapterProposals.find(
      (p) =>
        p.userId === a.id &&
        p.details.claimChapterId === c.id &&
        ["PENDING", "CHANGES_REQUESTED", "APPROVED"].includes(p.status),
    );
    need(
      existing?.status !== "PENDING",
      "Your claim is already pending USM review.",
    );
    const details = {
      kind: "Executive-board claim",
      claimChapterId: c.id,
      proposedName: c.name,
      university: c.university,
      position: input.position,
      evidence: input.evidence,
      applicantEmail: profile.email || a.email || "Demo account",
      attestation:
        "Applicant confirms they currently serve on this chapter’s executive board.",
    };
    if (existing)
      Object.assign(existing, { details, status: "PENDING", updatedAt: now });
    else
      s.chapterProposals.push({
        id: uid(),
        userId: a.id,
        universityKey: "claim:" + c.id + ":" + a.id + ":" + uid(),
        status: "PENDING",
        details,
        chapterId: c.id,
        reviewNote: "",
        reviewerId: null,
        createdAt: now,
        updatedAt: now,
      });
    audit("CHAPTER_CLAIM_SUBMITTED", c.id, c.id);
    return "Claim sent to USM. Officer access stays locked until human approval. Track it in My applications.";
  }
  if (input.action === "membershipApply") {
    const c = s.chapters.find((c) => c.id === input.chapterId);
    need(
      c && c.networkStatus !== "UNCLAIMED" && c.applicationsOpen !== false,
      "This chapter is not accepting applications.",
    );
    need(
      !s.memberships.some((m) => m.userId === a.id && m.chapterId === c.id),
      "You already belong to this chapter.",
    );
    const p = ensureProfile(s, a);
    const data = clean(input.answers, membershipQuestions, input.submit);
    data.universityEmail = p.email || a.email || "Fictional demo account";
    let application = s.membershipApplications.find(
      (x) =>
        x.userId === a.id &&
        x.chapterId === c.id &&
        ["DRAFT", "PENDING", "CHANGES_REQUESTED"].includes(x.status),
    );
    need(
      !application || application.status !== "PENDING",
      "An application is already pending.",
    );
    if (application)
      Object.assign(application, {
        answers: data,
        status: input.submit ? "PENDING" : "DRAFT",
        updatedAt: now,
      });
    else {
      application = {
        id: uid(),
        userId: a.id,
        chapterId: c.id,
        answers: data,
        status: input.submit ? "PENDING" : "DRAFT",
        formVersion: 1,
        reviewNote: "",
        reviewerId: null,
        createdAt: now,
        updatedAt: now,
      };
      s.membershipApplications.push(application);
    }
    if (input.submit) audit("MEMBERSHIP_SUBMITTED", application.id, c.id);
    return input.submit
      ? "Application submitted to the chapter’s officers."
      : "Application draft saved.";
  }
  if (input.action === "membershipReview") {
    const app = s.membershipApplications.find(
      (x) => x.id === input.applicationId,
    );
    need(app, "Application not found.");
    need(
      manages(s, a, app.chapterId),
      "Only this chapter’s authorized officers can review its applications.",
    );
    if (app.status === "APPROVED" && input.decision === "APPROVED")
      return "Already approved; membership was not duplicated.";
    need(
      app.status === "PENDING",
      "Only pending applications can be reviewed.",
    );
    Object.assign(app, {
      status: input.decision,
      reviewNote: input.note,
      reviewerId: a.id,
      updatedAt: now,
    });
    if (
      input.decision === "APPROVED" &&
      !s.memberships.some(
        (m) => m.userId === app.userId && m.chapterId === app.chapterId,
      )
    )
      s.memberships.push({
        id: uid(),
        userId: app.userId,
        chapterId: app.chapterId,
        role: "MEMBER",
        status: "ACTIVE",
        createdAt: now,
      });
    audit("MEMBERSHIP_" + input.decision, app.id, app.chapterId);
    return input.decision === "APPROVED"
      ? "Approved. Student added to the chapter roster."
      : "Application review saved.";
  }
  if (input.action === "chapterPropose") {
    const p = ensureProfile(s, a),
      data = clean(input.details, proposalQuestions, input.submit);
    data.universityEmail = p.email || a.email || "Fictional demo account";
    if (input.submit)
      need(
        /^\d+$/.test(data.students) &&
          Number(data.students) >= 1 &&
          Number(data.students) <= 1000,
        "Enter 1–1,000 interested students.",
      );
    const key = universityKey(data.university);
    need(key || !input.submit, "University is required.");
    const current = input.proposalId
      ? s.chapterProposals.find(
          (x) => x.id === input.proposalId && x.userId === a.id,
        )
      : undefined;
    need(!input.proposalId || current, "Proposal not found.");
    need(
      !current || ["DRAFT", "CHANGES_REQUESTED"].includes(current.status),
      "This proposal cannot be edited.",
    );
    if (key) {
      need(
        !s.chapters.some(
          (c) =>
            universityKey(c.university) === key &&
            (!s.chapters.some((x) => x.isSample === false) ||
              c.isSample === false),
        ),
        "A chapter for this university already exists.",
      );
      need(
        !s.chapterProposals.some(
          (x) =>
            x.id !== current?.id &&
            x.universityKey === key &&
            ["DRAFT", "PENDING", "CHANGES_REQUESTED", "APPROVED"].includes(
              x.status,
            ),
        ),
        "An active proposal already exists for this university.",
      );
    }
    // An unnamed draft still has a unique temporary university key.
    const proposal = current || {
      id: uid(),
      userId: a.id,
      universityKey: key || "draft-" + uid(),
      status: "DRAFT" as const,
      details: data,
      chapterId: null,
      reviewNote: "",
      reviewerId: null,
      createdAt: now,
      updatedAt: now,
    };
    Object.assign(proposal, {
      details: data,
      universityKey: key || proposal.universityKey,
      status: input.submit ? "PENDING" : "DRAFT",
      updatedAt: now,
    });
    if (!current) s.chapterProposals.push(proposal);
    if (input.submit) audit("CHAPTER_PROPOSED", proposal.id, null);
    return input.submit
      ? "Chapter proposal sent to USM for review."
      : "Chapter proposal draft saved.";
  }
  if (input.action === "proposalReview") {
    need(a.role === "ADMIN", "USM administrator access required.");
    const p = s.chapterProposals.find((p) => p.id === input.proposalId);
    need(p, "Proposal not found.");
    if (p.status === "APPROVED" && input.decision === "APPROVED")
      return "Already approved; no duplicate chapter or officer membership created.";
    need(p.status === "PENDING", "Only pending proposals can be reviewed.");
    if (p.details.claimChapterId) {
      const c = s.chapters.find((c) => c.id === p.details.claimChapterId);
      need(c, "Chapter no longer exists.");
      if (input.decision === "APPROVED") {
        need(
          c.networkStatus === "UNCLAIMED" &&
            !s.memberships.some(
              (m) =>
                m.chapterId === c.id &&
                m.role === "OFFICER" &&
                m.status === "ACTIVE",
            ),
          "Another claim has already been approved for this chapter.",
        );
        const profile = s.profiles.find((x) => x.id === p.userId);
        need(profile, "Applicant profile missing.");
        c.networkStatus = "USM_AFFILIATED";
        c.applicationsOpen = true;
        if (profile.role !== "ADMIN") profile.role = "OFFICER";
        if (!profile.chapterId) profile.chapterId = c.id;
        const membership = s.memberships.find(
          (m) => m.userId === p.userId && m.chapterId === c.id,
        );
        if (membership) membership.role = "OFFICER";
        else
          s.memberships.push({
            id: uid(),
            userId: p.userId,
            chapterId: c.id,
            role: "OFFICER",
            status: "ACTIVE",
            createdAt: now,
          });
      }
      Object.assign(p, {
        status: input.decision,
        reviewNote: input.note,
        reviewerId: a.id,
        updatedAt: now,
      });
      audit("CHAPTER_CLAIM_" + input.decision, p.id, c.id);
      return input.decision === "APPROVED"
        ? "Chapter claim approved. Officer access granted to this chapter only."
        : "Chapter claim review saved.";
    }
    if (input.decision === "APPROVED") {
      need(
        !s.chapters.some(
          (c) =>
            universityKey(c.university) === p.universityKey &&
            (!s.chapters.some((x) => x.isSample === false) ||
              c.isSample === false),
        ),
        "A chapter for this university already exists.",
      );
      const profile = s.profiles.find((x) => x.id === p.userId);
      need(profile, "Applicant profile missing.");
      const d = p.details,
        chapterId = uid();
      s.chapters.push({
        id: chapterId,
        name: d.proposedName,
        university: d.university,
        location: d.location,
        state: d.state,
        region: d.region,
        bio: d.goals,
        size: Number(d.students),
        skills: [],
        experience: [],
        availability: null,
        commitments: null,
        lat: null,
        lng: null,
        publicContact: null,
        logoUrl: null,
        applicationsOpen: true,
        isSample: false,
        networkStatus: "USM_AFFILIATED",
        universityRecognition: "NOT_CONFIRMED",
        onboarding: [
          "Confirm university registration and recognition requirements",
          "Meet USM onboarding coordinator",
          "Form an officer team and establish account ownership",
          "Plan an achievable first seva activity",
          "Save leadership handover notes",
        ],
      });
      if (profile.role !== "ADMIN") profile.role = "OFFICER";
      if (!profile.chapterId) profile.chapterId = chapterId;
      s.memberships.push({
        id: uid(),
        userId: p.userId,
        chapterId,
        role: "OFFICER",
        status: "ACTIVE",
        createdAt: now,
      });
      p.chapterId = chapterId;
    }
    Object.assign(p, {
      status: input.decision,
      reviewNote: input.note,
      reviewerId: a.id,
      updatedAt: now,
    });
    audit("CHAPTER_" + input.decision, p.id, p.chapterId);
    return input.decision === "APPROVED"
      ? "USM affiliation approved. Chapter, initial officer membership, portal, and onboarding checklist created. University recognition remains unconfirmed."
      : "Chapter proposal review saved.";
  }
  if (input.action === "chapterProfile") {
    need(
      manages(s, a, input.chapterId),
      "Only this chapter’s officers can edit it.",
    );
    const c = s.chapters.find((c) => c.id === input.chapterId)!;
    Object.assign(c, {
      ...(input.size !== undefined ? { size: input.size } : {}),
      bio: input.bio,
      location: input.location,
      state: input.state,
      publicContact: input.publicContact || null,
      logoUrl: input.logoUrl || null,
      applicationsOpen: input.applicationsOpen,
    });
    audit("CHAPTER_PROFILE_UPDATED", c.id, c.id);
    return "Public chapter profile updated.";
  }
  if (input.action === "chapterResource") {
    need(
      manages(s, a, input.chapterId),
      "Only this chapter’s officers can add resources.",
    );
    s.chapterResources.push({
      id: uid(),
      chapterId: input.chapterId,
      title: input.title,
      content: input.content,
      url: input.url || null,
      createdAt: now,
    });
    return "Private chapter resource saved.";
  }
}
export function portalVisible(s: State, a: Actor) {
  const managed = new Set(
      s.chapters.filter((c) => manages(s, a, c.id)).map((c) => c.id),
    ),
    member = new Set(
      s.memberships.filter((m) => m.userId === a.id).map((m) => m.chapterId),
    );
  const rosterIds = new Set(
    s.memberships.filter((m) => managed.has(m.chapterId)).map((m) => m.userId),
  );
  return {
    memberCounts: Object.fromEntries(
      s.chapters
        .filter((c) => member.has(c.id) || managed.has(c.id))
        .map((c) => [
          c.id,
          s.memberships.filter((m) => m.chapterId === c.id).length,
        ]),
    ),
    profiles: s.profiles.filter((p) => p.id === a.id || rosterIds.has(p.id)),
    memberships: s.memberships.filter(
      (m) => m.userId === a.id || managed.has(m.chapterId),
    ),
    membershipApplications: s.membershipApplications.filter(
      (x) => x.userId === a.id || managed.has(x.chapterId),
    ),
    chapterProposals: s.chapterProposals.filter(
      (p) => p.userId === a.id || (a.role === "ADMIN" && p.status !== "DRAFT"),
    ),
    chapterResources: s.chapterResources.filter(
      (r) => member.has(r.chapterId) || managed.has(r.chapterId),
    ),
    auditLogs: s.auditLogs.filter(
      (l) =>
        a.role === "ADMIN" ||
        l.actorId === a.id ||
        (!!l.chapterId && managed.has(l.chapterId)),
    ),
    networkStats:
      a.role === "ADMIN"
        ? {
            students: s.profiles.length,
            chapters: s.chapters.filter(
              (c) => c.isSample === false && c.networkStatus !== "UNCLAIMED",
            ).length,
            pendingChapters: s.chapterProposals.filter(
              (p) => p.status === "PENDING",
            ).length,
            pendingEvidence: s.submissions.filter((p) => p.status === "PENDING")
              .length,
            completed: s.points.filter((p) =>
              s.chapters.some(
                (c) => c.id === p.chapterId && c.isSample === false,
              ),
            ).length,
          }
        : undefined,
  };
}
export function actorFromProfile(
  s: State,
  p: Profile,
  identity: { email?: string; name?: string; verified: boolean },
  active?: string,
): Actor {
  const managed = s.memberships
    .filter((m) => m.userId === p.id && m.role === "OFFICER")
    .map((m) => m.chapterId);
  if (p.role === "OFFICER" && p.chapterId && !managed.includes(p.chapterId))
    managed.push(p.chapterId);
  return {
    id: p.id,
    role: p.role === "ADMIN" ? "ADMIN" : managed.length ? "OFFICER" : "STUDENT",
    chapterId:
      active && managed.includes(active) ? active : managed[0] || p.chapterId,
    email: identity.email,
    name: p.name || identity.name,
    verified: identity.verified,
    managedChapterIds: managed,
  };
}
