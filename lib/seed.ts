import type { State, Chapter, Challenge } from "./types";
const date = "2026-10-15T12:00:00.000Z";
export function seed(): State {
  const chapters: Chapter[] = [
    [
      "uw",
      "University of Washington SSA",
      "University of Washington",
      "West",
      "Seattle, WA",
      42,
      47.655,
      -122.303,
      ["Education", "Technology", "Community Seva"],
    ],
    [
      "stanford",
      "Stanford SSA",
      "Stanford University",
      "West",
      "Stanford, CA",
      30,
      37.427,
      -122.17,
      ["Technology", "Leadership"],
    ],
    [
      "uncc",
      "UNC Charlotte SSA",
      "UNC Charlotte",
      "Southeast",
      "Charlotte, NC",
      36,
      35.307,
      -80.735,
      ["Community Seva", "Education"],
    ],
    [
      "berkeley",
      "UC Berkeley SSA",
      "UC Berkeley",
      "West",
      "Berkeley, CA",
      55,
      37.871,
      -122.258,
      ["Advocacy", "Sikh Awareness"],
    ],
    [
      "ncsu",
      "NC State SSA",
      "NC State University",
      "Southeast",
      "Raleigh, NC",
      24,
      35.784,
      -78.682,
      ["Education", "Community Seva"],
    ],
  ].map((r) => ({
    id: r[0] as string,
    name: r[1] as string,
    university: r[2] as string,
    region: r[3] as string,
    location: r[4] as string,
    size: r[5] as number,
    lat: r[6] as number,
    lng: r[7] as number,
    skills: r[8] as string[],
    availability: null,
    commitments: null,
    experience: ["Community Seva"],
    bio: "A fictional demonstration chapter connecting students through seva, sangat, and learning.",
  }));
  const challenges: Challenge[] = [
    {
      id: "warmth",
      title: "A little warmth. A lasting impact.",
      description:
        "Help our fictional neighborhood outreach team assemble and distribute winter care kits for neighbors experiencing housing insecurity. Bring your chapter together for a practical afternoon of seva.",
      organization: "Seattle Community Care · Demo",
      type: "Community Request",
      category: "Community Seva",
      location: "Seattle, WA",
      region: "West",
      deadline: "2026-11-15",
      volunteers: 12,
      points: 200,
      grant: 150,
      eligibility:
        "Open to SSA chapters. Coordinate distribution with the requesting organization.",
      grantEligibility:
        "Up to $150 for approved care-kit supplies. Receipts required; tracking only.",
      completion:
        "Assemble at least 40 care kits. Provide an itemized kit list, distribution confirmation from the organization, and a receipt summary.",
      instructions:
        "Submit a project summary, total chapter volunteer-hours, participant count, and an evidence link. Do not include recipient names or identifying photos.",
      status: "OPEN",
      skills: ["Community Seva"],
      lat: 47.606,
      lng: -122.332,
      createdAt: date,
    },
    {
      id: "digital",
      title: "Build a bridge to digital confidence",
      description:
        "Run an introductory digital literacy workshop for community members: safe browsing, everyday tools, and confidence online.",
      organization: "Neighborhood Learning Collective · Demo",
      type: "Community Request",
      category: "Technology",
      location: "Charlotte, NC",
      region: "Southeast",
      deadline: "2026-11-22",
      volunteers: 6,
      points: 180,
      grant: 0,
      eligibility:
        "A chapter with at least two facilitators comfortable teaching basic digital skills.",
      grantEligibility: "No grant offered.",
      completion:
        "Deliver a 90-minute workshop, share the lesson outline, and report anonymized attendance and feedback.",
      instructions:
        "Include lesson materials and an organization confirmation link. Never submit participant contact details.",
      status: "OPEN",
      skills: ["Technology", "Education"],
      lat: 35.227,
      lng: -80.843,
      createdAt: date,
    },
    {
      id: "awareness",
      title: "Make room for understanding",
      description:
        "Create a welcoming Sikh Awareness Week activation on your campus, with a learning station and a facilitated conversation.",
      organization: "USM National Challenge · Demo",
      type: "National Challenge",
      category: "Sikh Awareness",
      location: "Any campus",
      region: "National",
      deadline: "2026-12-01",
      volunteers: null,
      points: 250,
      grant: 100,
      eligibility: "All demonstration SSA chapters.",
      grantEligibility:
        "Approved educational materials with receipts, up to $100. Tracking only.",
      completion:
        "Host one campus activation, share an educational resource, and submit an anonymized reflection on what students learned.",
      instructions:
        "Provide an agenda, resource link, and campus event confirmation.",
      status: "OPEN",
      skills: ["Sikh Awareness", "Education"],
      lat: null,
      lng: null,
      createdAt: date,
    },
    {
      id: "shared",
      title: "Two campuses. One shared purpose.",
      description:
        "Partner with another SSA to organize a joint service project and create a reusable playbook for the next generation.",
      organization: "USM National Challenge · Demo",
      type: "National Challenge",
      category: "Interchapter Collaboration",
      location: "Nationwide",
      region: "National",
      deadline: "2026-12-10",
      volunteers: null,
      points: 300,
      grant: 0,
      eligibility:
        "At least two chapters collaborate; one lead chapter submits and receives the award.",
      grantEligibility: "No grant offered.",
      completion:
        "Document a joint service activity and a reusable playbook. Include confirmation from the partner chapter.",
      instructions:
        "Lead chapter submits the playbook link, partner confirmation, and verified effort.",
      status: "OPEN",
      skills: ["Leadership", "Community Seva"],
      lat: null,
      lng: null,
      createdAt: date,
    },
  ];
  return {
    chapters,
    challenges,
    participations: [
      {
        id: "p-seed",
        chapterId: "stanford",
        challengeId: "digital",
        createdAt: date,
      },
    ],
    submissions: [
      {
        id: "s-seed",
        participationId: "p-seed",
        summary: "A community digital skills workshop",
        impact: "Fictional workshop reaching 18 community members.",
        evidence:
          "Fictional demonstration evidence reviewed for the seeded achievement.",
        attachment: null,
        participants: 6,
        hours: 6,
        status: "APPROVED",
        feedback: "Seeded fictional achievement.",
        reviewerId: "demo-reviewer",
        verifiedHours: 6,
        createdAt: date,
      },
    ],
    points: [
      {
        id: "pt-seed",
        chapterId: "stanford",
        submissionId: "s-seed",
        amount: 223,
        semester: "Fall 2026",
        createdAt: date,
      },
    ],
    grants: [],
    posts: [
      {
        id: "post-seed",
        chapterId: "stanford",
        submissionId: "s-seed",
        title: "Small skills, new possibilities",
        description:
          "Fictional demo achievement: Stanford SSA hosted a digital literacy workshop. 6 volunteer-hours verified by a demonstration reviewer.",
        category: "Technology",
        verified: true,
        status: "PUBLISHED",
        moderation: "Factual achievement template",
        createdAt: date,
      },
    ],
    reactions: [],
    interests: [],
    profiles: [],
    documents: [
      {
        id: "langar",
        title: "A thoughtful guide to community seva",
        description:
          "From listening to a community partner to reflecting on impact: a practical starting point.",
        category: "Seva",
        source: "Fictional sample · not an official USM document",
        url: null,
        updatedAt: "2026-10-15",
        sample: true,
        content:
          "Fictional sample guide. Start by asking a community partner what they need. Agree on scope, volunteer roles, venue access, food safety requirements, accessibility, and a contact person. For a langar seva event, coordinate respectfully with the hosting Gurdwara, confirm kitchen rules and dietary needs, train volunteers, and plan safe food handling with the host. Assign preparation, serving, cleanup, and transport roles. Confirm permissions and costs before committing. Keep recipient information private. Afterward, thank volunteers, collect anonymized feedback, and document lessons for future officers.",
      },
      {
        id: "planning",
        title: "Your first campus event, step by step",
        description:
          "A simple four-week timeline, roles checklist, and reflection template.",
        category: "Event Planning",
        source: "Fictional sample · not an official USM document",
        url: null,
        updatedAt: "2026-10-15",
        sample: true,
        content:
          "Fictional sample planning guide. Four weeks before: define purpose, audience, accessible venue, campus permissions, and a budget ceiling. Three weeks before: assign an owner for logistics, publicity, volunteers, and finance. Two weeks before: confirm speakers and vendors and open registration with minimal personal data. One week before: share a run of show, contingency plan, and volunteer briefing. Event day: check accessibility, welcome attendees, and track anonymous attendance. Within a week: reconcile expenses, thank partners, and save a handover note.",
      },
      {
        id: "budget",
        title: "Build a budget you can stand behind",
        description:
          "Estimate costs, plan a contingency, and make a clear sponsorship ask.",
        category: "Fundraising",
        source: "Fictional sample · not an official USM document",
        url: null,
        updatedAt: "2026-10-15",
        sample: true,
        content:
          "Fictional sample budget guide. List venue, food, supplies, accessibility, publicity, and transport estimates with quantity and unit cost. Add a contingency line and identify confirmed funding separately from hoped-for sponsorship. Have the chapter and campus authority approve expenses before spending. A sponsorship email should introduce the chapter and event purpose, explain expected community benefit, specify the requested cash or in-kind support, and offer a contact and next step. Do not promise tax deductibility or benefits without authorization.",
      },
      {
        id: "handover",
        title: "Leave the next team a head start",
        description: "A leadership transition checklist built for continuity.",
        category: "Leadership Transition",
        source: "Fictional sample · not an official USM document",
        url: null,
        updatedAt: "2026-10-15",
        sample: true,
        content:
          "Fictional sample transition guide. Schedule a handover meeting. Record role responsibilities, campus processes, event retrospectives, approved budgets, and partner coordination procedures. Transfer accounts using official university policies, never sharing personal passwords. Keep private student records out of public resources. New presidents should meet the committee, listen to members, confirm campus registration requirements, and pick one achievable first project.",
      },
    ],
  };
}
