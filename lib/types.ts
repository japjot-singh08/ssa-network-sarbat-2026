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
export type Actor = { id: string; role: Role; chapterId: string | null };
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
  lat: number;
  lng: number;
  bio: string;
};
export type Challenge = {
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
export type Profile = { id: string; role: Role; chapterId: string | null };
export type State = {
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
};
export type PublicState = State & {
  actor: Actor;
  demo: boolean;
  aiConfigured: boolean;
};
