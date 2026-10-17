export const categories = [
  "Community Seva",
  "Education",
  "Technology",
  "Advocacy",
  "Leadership",
  "Sikh Awareness",
  "Interchapter Collaboration",
  "Other",
] as const;
export const resourceCategories = [
  "Event Planning",
  "Fundraising",
  "Seva",
  "Leadership Transition",
  "Sponsorship",
  "Membership Engagement",
  "Operations",
  "Other",
] as const;
export type Role = "STUDENT" | "OFFICER" | "ADMIN";
export type Actor = {
  id: string;
  role: Role;
  chapterId: string | null;
  email?: string;
  name?: string;
  verified?: boolean;
  managedChapterIds?: string[];
};
export type Chapter = {
  id: string;
  name: string;
  university: string;
  region: string;
  location: string;
  size: number;
  skills: string[];
  availability: string | null;
  commitments: string[] | null;
  experience: string[];
  lat: number | null;
  lng: number | null;
  publicContact?: string | null;
  logoUrl?: string | null;
  applicationsOpen?: boolean;
  state?: string;
  isSample?: boolean;
  networkStatus?: string;
  universityRecognition?: string;
  onboarding?: string[];
  bio: string;
};
export type Challenge = {
  imageUrl?: string | null;
  maxChapters?: number | null;
  restrictRegion?: boolean;
  sample?: boolean;
  id: string;
  title: string;
  description: string;
  organization: string;
  type: "Community Request" | "National Challenge";
  category: string;
  location: string;
  region: string;
  deadline: string | null;
  volunteers: number | null;
  points: number;
  grant: number;
  eligibility: string;
  grantEligibility: string;
  completion: string;
  instructions: string;
  status: "OPEN" | "CLOSED";
  skills: string[];
  lat: number | null;
  lng: number | null;
  createdAt: string;
};
export type Participation = {
  id: string;
  chapterId: string;
  challengeId: string;
  createdAt: string;
};
export type Submission = {
  id: string;
  participationId: string;
  summary: string;
  impact: string;
  evidence: string;
  attachment: string | null;
  participants: number;
  hours: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_INFO";
  feedback: string;
  reviewerId: string | null;
  verifiedHours: number | null;
  createdAt: string;
};
export type Point = {
  id: string;
  chapterId: string;
  submissionId: string;
  amount: number;
  semester: string;
  createdAt: string;
};
export type Grant = {
  id: string;
  chapterId: string;
  submissionId: string;
  amount: number;
  createdAt: string;
};
export type Post = {
  imageUrl?: string | null;
  sample?: boolean;
  id: string;
  chapterId: string;
  submissionId: string | null;
  title: string;
  description: string;
  category: string;
  verified: boolean;
  status: "PUBLISHED" | "PENDING" | "FLAGGED" | "REJECTED";
  moderation: string;
  createdAt: string;
};
export type Reaction = { id: string; postId: string; userId: string };
export type Document = {
  id: string;
  title: string;
  description: string;
  category: string;
  source: string;
  url: string | null;
  updatedAt: string | null;
  content: string;
  sample: boolean;
};
export type Interest = { id: string; userId: string; challengeId: string };
export type Profile = {
  id: string;
  role: Role;
  chapterId: string | null;
  name?: string;
  email?: string;
  academicYear?: string;
  major?: string;
};
export type CommunityRequest = {
  id: string;
  details: Record<string, string>;
  assessment: Record<string, unknown> | null;
  status: "PENDING" | "PUBLISHED" | "REJECTED";
  reviewNote: string;
  challengeId: string | null;
  createdAt: string;
};
export type State = {
  communityRequests: CommunityRequest[];
  chapters: Chapter[];
  challenges: Challenge[];
  participations: Participation[];
  submissions: Submission[];
  points: Point[];
  grants: Grant[];
  posts: Post[];
  reactions: Reaction[];
  documents: Document[];
  interests: Interest[];
  profiles: Profile[];
  memberships: Membership[];
  membershipApplications: MembershipApplication[];
  chapterProposals: ChapterProposal[];
  chapterResources: ChapterResource[];
  auditLogs: AuditLog[];
};
export type PublicState = State & {
  actor: Actor;
  demo: boolean;
  aiConfigured: boolean;
  sampleData?: boolean;
  impact?: { projects: number; hours: number; chapters: number };
  memberCounts?: Record<string, number>;
  networkStats?: {
    students: number;
    chapters: number;
    pendingChapters: number;
    pendingEvidence: number;
    completed: number;
  };
};

export type ApplicationStatus =
  "DRAFT" | "PENDING" | "CHANGES_REQUESTED" | "APPROVED" | "DECLINED";
export type Membership = {
  id: string;
  userId: string;
  chapterId: string;
  role: "MEMBER" | "OFFICER";
  status: "ACTIVE";
  createdAt: string;
};
export type MembershipApplication = {
  id: string;
  userId: string;
  chapterId: string;
  status: ApplicationStatus;
  answers: Record<string, string>;
  formVersion: number;
  reviewNote: string;
  reviewerId: string | null;
  createdAt: string;
  updatedAt: string;
};
export type ChapterProposal = {
  id: string;
  userId: string;
  universityKey: string;
  status: ApplicationStatus;
  details: Record<string, string>;
  chapterId: string | null;
  reviewNote: string;
  reviewerId: string | null;
  createdAt: string;
  updatedAt: string;
};
export type ChapterResource = {
  id: string;
  chapterId: string;
  title: string;
  content: string;
  url: string | null;
  createdAt: string;
};
export type AuditLog = {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  chapterId: string | null;
  createdAt: string;
};
