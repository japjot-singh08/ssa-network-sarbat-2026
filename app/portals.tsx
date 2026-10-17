"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import type {
  PublicState,
  Chapter,
  MembershipApplication,
  ChapterProposal,
} from "@/lib/types";
import { membershipQuestions, proposalQuestions } from "@/lib/membership";
type Act = (data: unknown) => Promise<boolean>;
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Tag({ value }: { value: string }) {
  return (
    <span className={"badge " + (value === "APPROVED" ? "green" : "gold")}>
      {value.replaceAll("_", " ")}
    </span>
  );
}
function Intro({ title, description }: { title: string; description: string }) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">YOUR SSA NETWORK</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
export function AuthPanel({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "resend">(
      "login",
    ),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  return (
    <>
      <p className="muted small">
        Use an email address you control and verify it. New accounts start as
        students; officer and administrator permissions require approval.
      </p>
      <div className="tabs">
        <button
          className={mode === "login" ? "selected" : ""}
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Sign in
        </button>
        <button
          className={mode === "signup" ? "selected" : ""}
          onClick={() => {
            setMode("signup");
            setError("");
          }}
        >
          Create account
        </button>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          setMessage("");
          const f = new FormData(e.currentTarget);
          try {
            const r = await fetch("/api/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                mode,
                email: f.get("email"),
                ...(["signup", "login"].includes(mode)
                  ? { password: f.get("password") }
                  : {}),
                ...(mode === "signup" ? { name: f.get("name") } : {}),
              }),
            });
            const data = await r.json();
            if (!r.ok) throw new Error(data.error);
            setMessage(data.message);
            if (mode === "login") await onSignedIn();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {mode === "signup" && (
          <Field label="Preferred name">
            <input
              name="name"
              required
              maxLength={100}
              autoComplete="given-name"
            />
          </Field>
        )}
        <Field label="Email address">
          <input
            type="email"
            name="email"
            required
            autoComplete="username"
            placeholder="you@university.edu"
          />
        </Field>
        {["signup", "login"].includes(mode) && (
          <Field
            label={
              mode === "signup"
                ? "Password (at least 12 characters)"
                : "Password"
            }
          >
            <input
              name="password"
              type="password"
              required
              minLength={mode === "signup" ? 12 : 1}
              maxLength={128}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
            />
          </Field>
        )}
        <button className="button" disabled={busy}>
          {busy
            ? "Please wait…"
            : mode === "signup"
              ? "Create student account"
              : mode === "reset"
                ? "Send reset email"
                : mode === "resend"
                  ? "Resend verification"
                  : "Sign in"}{" "}
          <ArrowRight size={16} />
        </button>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
      </form>
      <div className="row wrap account-links">
        <button className="text-button" onClick={() => setMode("reset")}>
          Forgot password?
        </button>
        <button className="text-button" onClick={() => setMode("resend")}>
          Resend verification email
        </button>
      </div>
      {mode === "signup" && (
        <p className="small muted">
          We store your preferred name, email address, and the applications you
          choose to submit. Membership applications are private to you and the
          receiving chapter’s officers.
        </p>
      )}
    </>
  );
}
export function Portals({
  view,
  state,
  go,
  act,
  onSignIn,
}: {
  view: string;
  state: PublicState;
  go: (v: string) => void;
  act: Act;
  onSignIn: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState(""),
    [region, setRegion] = useState("All regions"),
    [province, setProvince] = useState("All states"),
    [university, setUniversity] = useState("All universities"),
    [selected, setSelected] = useState<Chapter | null>(null),
    [joining, setJoining] = useState<Chapter | null>(null),
    [editProposal, setEditProposal] = useState<ChapterProposal | null>(null),
    [chapterTab, setChapterTab] = useState("Overview"),
    [selectedChapter, setSelectedChapter] = useState("");
  const profileRef = useRef<HTMLElement>(null);
  const applicationRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const target = joining
      ? applicationRef.current
      : selected
        ? profileRef.current
        : null;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.focus({ preventScroll: true });
    }
  }, [selected, joining]);
  const actor = state.actor,
    profile = state.profiles.find((p) => p.id === actor.id),
    myMemberships = state.memberships.filter((m) => m.userId === actor.id),
    managed = state.chapters.filter(
      (c) =>
        actor.managedChapterIds?.includes(c.id) ||
        (actor.role === "OFFICER" && actor.chapterId === c.id),
    ),
    mine = state.membershipApplications.filter((a) => a.userId === actor.id);
  const memberChapters = state.chapters.filter(
    (c) =>
      myMemberships.some((m) => m.chapterId === c.id) ||
      managed.some((m) => m.id === c.id),
  );
  const active =
      memberChapters.find((c) => c.id === selectedChapter) || memberChapters[0],
    isOfficer = !!active && managed.some((c) => c.id === active.id);
  const pending = mine.filter((a) => a.status === "PENDING").length;
  const states = [
    ...new Set(
      state.chapters.map(
        (c) => c.state || c.location.split(",").at(-1)?.trim() || "Unknown",
      ),
    ),
  ];
  if (actor.id === "guest" && view !== "directory")
    return (
      <div className="empty">
        <GraduationCap />
        <h2>Your next chapter starts here.</h2>
        <p>
          Sign in or create a verified university account to apply, track
          membership, and access your portal.
        </p>
        <button className="button" onClick={onSignIn}>
          Sign in / Create account
        </button>
        <button className="text-button" onClick={() => go("directory")}>
          Explore public chapters <ArrowRight size={16} />
        </button>
      </div>
    );
  const applicationForm = joining && (
    <section
      ref={applicationRef}
      tabIndex={-1}
      aria-label="Chapter membership application"
      className="panel portal-form"
    >
      <div className="row between">
        <h2>Apply to {joining.name}</h2>
        <button className="text-button" onClick={() => setJoining(null)}>
          Close
        </button>
      </div>
      <p className="muted small">
        Initial sample questions · Form version 1. Your verified account email
        is included automatically. Only you and authorized officers of this
        chapter can see your answers.
      </p>
      <ApplicationForm
        key={joining.id}
        questions={membershipQuestions}
        initial={
          mine.find(
            (a) =>
              a.chapterId === joining.id &&
              ["DRAFT", "CHANGES_REQUESTED"].includes(a.status),
          )?.answers
        }
        submit={async (answers, submit) => {
          if (
            await act({
              action: "membershipApply",
              chapterId: joining.id,
              answers,
              submit,
            })
          ) {
            setJoining(null);
            go("applications");
          }
        }}
      />
    </section>
  );
  return (
    <>
      {view === "dashboard" && (
        <>
          <Intro
            title={`Welcome${profile?.name ? ", " + profile.name : ""}.`}
            description="Your place in the sangat. Your next opportunity to make a difference."
          />
          <div className="portal-actions">
            <button className="button" onClick={() => go("directory")}>
              <Users size={17} />
              Join an SSA
            </button>
            <button className="button secondary" onClick={() => go("start")}>
              <Plus size={17} />
              Start a New SSA
            </button>
            <button className="text-button" onClick={() => go("sahayak")}>
              Ask Sahayak <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="portal-stats">
            <div className="panel">
              <b>{myMemberships.length}</b>
              <span>Chapter memberships</span>
            </div>
            <div className="panel">
              <b>{pending}</b>
              <span>Pending applications</span>
            </div>
            <div className="panel">
              <b>
                {state.challenges.filter((c) => c.status === "OPEN").length}
              </b>
              <span>Open opportunities</span>
            </div>
          </div>
          <div className="two-col">
            <section className="panel">
              <h2>My SSA connections</h2>
              {memberChapters.length ? (
                memberChapters.map((c) => (
                  <button
                    className="portal-list-button"
                    key={c.id}
                    onClick={() => {
                      setSelectedChapter(c.id);
                      go("myssa");
                    }}
                  >
                    <Users size={18} />
                    <span>
                      <b>{c.name}</b>
                      <small>
                        {managed.some((x) => x.id === c.id)
                          ? "Officer access"
                          : "Chapter member"}
                      </small>
                    </span>
                    <ArrowRight size={16} />
                  </button>
                ))
              ) : (
                <p>
                  No chapter membership yet. Explore the network or propose an
                  SSA at your university.
                </p>
              )}
              <button
                className="text-button"
                onClick={() => go("applications")}
              >
                Track my applications <ArrowRight size={16} />
              </button>
            </section>
            <section className="panel">
              <h2>A next act of seva</h2>
              {state.challenges
                .filter((c) => c.status === "OPEN")
                .slice(0, 3)
                .map((c) => (
                  <div className="portal-list-line" key={c.id}>
                    <b>{c.title}</b>
                    <span>
                      {c.category} · {c.location}
                    </span>
                  </div>
                ))}
              <button className="text-button" onClick={() => go("arena")}>
                Explore Arena <ArrowRight size={16} />
              </button>
            </section>
          </div>
          <section className="panel portal-section">
            <h2>Across the network</h2>
            {state.posts
              .filter((p) => p.status === "PUBLISHED")
              .slice(-3)
              .reverse()
              .map((p) => (
                <div className="portal-list-line" key={p.id}>
                  <b>{p.title}</b>
                  <span>
                    {state.chapters.find((c) => c.id === p.chapterId)?.name}
                  </span>
                </div>
              ))}
            <button className="text-button" onClick={() => go("feed")}>
              Open National Feed <ArrowRight size={16} />
            </button>
          </section>
        </>
      )}
      {view === "directory" && (
        <>
          <Intro
            title="Find your sangat."
            description="Discover SSA chapters across campuses. Public profiles share activities and achievements; private rosters stay private."
          />
          <div className="filters">
            <label className="search">
              <Search size={18} />
              <input
                aria-label="Search chapters"
                placeholder="Search chapters, universities, locations…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
            <select
              aria-label="University filter"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            >
              {[
                "All universities",
                ...new Set(state.chapters.map((c) => c.university)),
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select
              aria-label="State filter"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            >
              {["All states", ...states].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select
              aria-label="Chapter region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {[
                "All regions",
                ...new Set(state.chapters.map((c) => c.region)),
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="resource-grid">
            {state.chapters
              .filter(
                (c) =>
                  (region === "All regions" || c.region === region) &&
                  (university === "All universities" ||
                    c.university === university) &&
                  (province === "All states" ||
                    (c.state || c.location.split(",").at(-1)?.trim()) ===
                      province) &&
                  `${c.name} ${c.university} ${c.location}`
                    .toLowerCase()
                    .includes(q.toLowerCase()),
              )
              .map((c) => (
                <button
                  className="panel resource-card"
                  key={c.id}
                  onClick={() => setSelected(c)}
                >
                  <div className="row between">
                    <span className="resource-icon">
                      {c.logoUrl ? (
                        <Image
                          src={c.logoUrl}
                          alt={`${c.name} logo`}
                          width={40}
                          height={40}
                          unoptimized
                        />
                      ) : (
                        <GraduationCap />
                      )}
                    </span>
                    <span className="badge">
                      {c.isSample !== false
                        ? "Fictional sample"
                        : "USM affiliated"}
                    </span>
                  </div>
                  <h3>{c.name}</h3>
                  <p>
                    {c.university} · {c.location}
                  </p>
                  <p>{c.bio}</p>
                  <span className="text-button">
                    View chapter <ArrowUpRight size={16} />
                  </span>
                </button>
              ))}
          </div>
          <div className="bottom-callout">
            <Plus />
            <div>
              <h3>No SSA at your university?</h3>
              <p>Bring your idea to USM and start building your chapter.</p>
            </div>
            <button className="button" onClick={() => go("start")}>
              Start a Chapter
            </button>
          </div>
          {selected && (
            <section
              ref={profileRef}
              tabIndex={-1}
              aria-label="Chapter profile"
              className="panel portal-section"
            >
              <div className="row between">
                <h2>{selected.name}</h2>
                <button
                  className="text-button"
                  onClick={() => setSelected(null)}
                >
                  Close profile
                </button>
              </div>
              <p>
                {selected.university} ·{" "}
                <MapPin size={13} className="inline-icon" />
                {selected.location} · {selected.region}
              </p>
              <p>{selected.bio}</p>
              {selected.publicContact && (
                <p>
                  Approved public contact:{" "}
                  <a href={"mailto:" + selected.publicContact}>
                    {selected.publicContact}
                  </a>
                </p>
              )}
              <p className="small muted">
                {selected.isSample !== false
                  ? "Fictional demonstration chapter."
                  : `Network status: USM affiliated. University recognition: ${selected.universityRecognition === "CONFIRMED" ? "confirmed" : "not confirmed"}. USM affiliation does not establish university recognition.`}
              </p>
              <p>
                {state.points
                  .filter((p) => p.chapterId === selected.id)
                  .reduce((n, p) => n + p.amount, 0)}{" "}
                verified chapter points ·{" "}
                {
                  state.posts.filter(
                    (p) =>
                      p.chapterId === selected.id && p.status === "PUBLISHED",
                  ).length
                }{" "}
                public activities
              </p>
              <div className="row wrap">
                <button
                  className="button"
                  disabled={
                    selected.applicationsOpen === false ||
                    myMemberships.some((m) => m.chapterId === selected.id) ||
                    mine.some(
                      (a) =>
                        a.chapterId === selected.id && a.status === "PENDING",
                    )
                  }
                  onClick={() => {
                    if (actor.id === "guest") {
                      onSignIn();
                      return;
                    }
                    setJoining(selected);
                  }}
                >
                  {myMemberships.some((m) => m.chapterId === selected.id)
                    ? "Already a member"
                    : mine.some(
                          (a) =>
                            a.chapterId === selected.id &&
                            a.status === "PENDING",
                        )
                      ? "Application pending"
                      : selected.applicationsOpen === false
                        ? "Applications closed"
                        : "Apply to Join"}
                </button>
              </div>
              <h3>Recent public activity</h3>
              {state.posts
                .filter(
                  (p) =>
                    p.chapterId === selected.id && p.status === "PUBLISHED",
                )
                .map((p) => (
                  <div className="portal-list-line" key={p.id}>
                    <b>{p.title}</b>
                    <p>{p.description}</p>
                  </div>
                ))}
            </section>
          )}
          {applicationForm}
        </>
      )}
      {view === "applications" && (
        <>
          <Intro
            title="Your next chapter, in progress."
            description="Drafts, submitted applications, and decisions—all in one place."
          />
          <h2>Chapter membership applications</h2>
          <div className="stack portal-section">
            {mine.length ? (
              mine.map((a) => (
                <article className="panel" key={a.id}>
                  <Tag value={a.status} />
                  <h3>
                    {state.chapters.find((c) => c.id === a.chapterId)?.name}
                  </h3>
                  {a.reviewNote && (
                    <div className="notice">
                      Officer feedback: {a.reviewNote}
                    </div>
                  )}
                  <details>
                    <summary>Your submitted answers</summary>
                    <AnswerList values={a.answers} />
                  </details>
                  {["DRAFT", "CHANGES_REQUESTED"].includes(a.status) && (
                    <button
                      className="button secondary"
                      onClick={() =>
                        setJoining(
                          state.chapters.find((c) => c.id === a.chapterId)!,
                        )
                      }
                    >
                      Edit and resubmit
                    </button>
                  )}
                </article>
              ))
            ) : (
              <div className="empty">
                <Users />
                <p>No membership applications yet.</p>
                <button className="button" onClick={() => go("directory")}>
                  Join an SSA
                </button>
              </div>
            )}
          </div>
          {applicationForm}
          <h2 className="portal-section">New chapter proposals</h2>
          <div className="stack portal-section">
            {state.chapterProposals
              .filter((p) => p.userId === actor.id)
              .map((p) => (
                <article className="panel" key={p.id}>
                  <Tag
                    value={
                      p.status === "PENDING" ? "PENDING USM REVIEW" : p.status
                    }
                  />
                  <h3>{p.details.proposedName || "Untitled draft"}</h3>
                  <p>{p.details.university}</p>
                  {p.reviewNote && (
                    <div className="notice">USM feedback: {p.reviewNote}</div>
                  )}
                  {["DRAFT", "CHANGES_REQUESTED"].includes(p.status) && (
                    <button
                      className="button secondary"
                      onClick={() => {
                        setEditProposal(p);
                        go("start");
                      }}
                    >
                      Edit proposal
                    </button>
                  )}
                  {p.status === "APPROVED" && (
                    <p>
                      USM affiliation approved. University recognition still
                      needs to be confirmed separately.
                    </p>
                  )}
                </article>
              ))}
          </div>
        </>
      )}
      {view === "start" && (
        <>
          <Intro
            title="Build the chapter you wish existed."
            description="Tell USM about your university and your vision. Affiliation requires a human USM decision."
          />
          <div className="notice">
            <ShieldCheck size={19} />
            USM affiliation is separate from official recognition by your
            university. Submitting a proposal does not create a chapter or grant
            officer access.
          </div>
          <section className="panel">
            <ApplicationForm
              key={editProposal?.id || "new"}
              questions={proposalQuestions}
              initial={editProposal?.details}
              submit={async (details, submit) => {
                if (
                  await act({
                    action: "chapterPropose",
                    proposalId: editProposal?.id,
                    details,
                    submit,
                  })
                ) {
                  setEditProposal(null);
                  go("applications");
                }
              }}
            />
          </section>
        </>
      )}
      {view === "myssa" && (
        <>
          <Intro
            title={
              active ? `${active.name} — Chapter portal` : "Your SSA home."
            }
            description="Your chapter’s people, projects, and knowledge, connected to the national network."
          />
          {!active ? (
            <div className="empty">
              <Users />
              <h3>Your chapter connection starts here.</h3>
              <button className="button" onClick={() => go("directory")}>
                Join an SSA
              </button>
              <button className="button secondary" onClick={() => go("start")}>
                Start a Chapter
              </button>
            </div>
          ) : (
            <>
              <div className="row wrap">
                <select
                  aria-label="Select my chapter"
                  value={active.id}
                  onChange={(e) => {
                    setSelectedChapter(e.target.value);
                    setChapterTab("Overview");
                  }}
                >
                  {memberChapters.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="badge">
                  {isOfficer ? "Officer management" : "Member access"}
                </span>
                {isOfficer && active.id !== actor.chapterId && (
                  <button
                    className="button secondary"
                    onClick={async () => {
                      await fetch("/api/auth", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          mode: "activeChapter",
                          chapterId: active.id,
                        }),
                      });
                      location.reload();
                    }}
                  >
                    Use this chapter in Arena
                  </button>
                )}
              </div>
              <div className="tabs portal-section">
                {[
                  "Overview",
                  ...(isOfficer
                    ? ["Applications", "Members", "Chapter Profile"]
                    : []),
                  "Arena",
                  "Resources",
                  "Opportunities",
                ].map((t) => (
                  <button
                    key={t}
                    className={chapterTab === t ? "selected" : ""}
                    onClick={() => setChapterTab(t)}
                  >
                    {t}
                    {t === "Applications" &&
                      ` (${state.membershipApplications.filter((a) => a.chapterId === active.id && a.status === "PENDING").length})`}
                  </button>
                ))}
              </div>
              {chapterTab === "Overview" && (
                <>
                  <div className="portal-stats">
                    <div className="panel">
                      <b>
                        {
                          state.memberships.filter(
                            (m) => m.chapterId === active.id,
                          ).length
                        }
                      </b>
                      <span>
                        Recorded members{" "}
                        {isOfficer ? "" : "(your membership only)"}
                      </span>
                    </div>
                    <div className="panel">
                      <b>
                        {state.points
                          .filter((p) => p.chapterId === active.id)
                          .reduce((n, p) => n + p.amount, 0)}
                      </b>
                      <span>Verified chapter points</span>
                    </div>
                    <div className="panel">
                      <b>
                        {
                          state.participations.filter(
                            (p) => p.chapterId === active.id,
                          ).length
                        }
                      </b>
                      <span>Arena projects</span>
                    </div>
                  </div>
                  <section className="panel">
                    <h2>{active.university}</h2>
                    <p>{active.bio}</p>
                    <p className="small muted">
                      USM affiliation: {active.networkStatus || "Demonstration"}{" "}
                      · University recognition:{" "}
                      {active.universityRecognition || "Not recorded"}
                    </p>
                    <h3>Onboarding checklist</h3>
                    {active.onboarding?.length ? (
                      <ul className="onboarding">
                        {active.onboarding.map((item) => (
                          <li key={item}>
                            <CheckCircle2 size={16} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No onboarding checklist recorded.</p>
                    )}
                    <h3>Upcoming activities</h3>
                    <p>
                      Use Arena and the national Feed to discover planned
                      activities. No separate chapter calendar is recorded.
                    </p>
                  </section>
                </>
              )}
              {chapterTab === "Applications" && isOfficer && (
                <div className="stack">
                  {state.membershipApplications.filter(
                    (a) => a.chapterId === active.id,
                  ).length === 0 ? (
                    <div className="empty">
                      <p>No applications to this chapter yet.</p>
                    </div>
                  ) : (
                    state.membershipApplications
                      .filter((a) => a.chapterId === active.id)
                      .map((a) => (
                        <ReviewApplication
                          key={a.id}
                          application={a}
                          act={act}
                        />
                      ))
                  )}
                </div>
              )}
              {chapterTab === "Members" && isOfficer && (
                <section className="panel">
                  <h2>Private chapter roster</h2>
                  <p>
                    Visible only to authorized officers. Do not publish or
                    export private student details.
                  </p>
                  <div className="roster-scroll">
                    <table className="roster">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Account email</th>
                          <th>Academic year</th>
                          <th>Role</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.memberships
                          .filter((m) => m.chapterId === active.id)
                          .map((m) => {
                            const p = state.profiles.find(
                                (p) => p.id === m.userId,
                              ),
                              application = state.membershipApplications.find(
                                (a) =>
                                  a.userId === m.userId &&
                                  a.chapterId === active.id &&
                                  a.status === "APPROVED",
                              );
                            return (
                              <tr key={m.id}>
                                <td>
                                  {p?.name ||
                                    application?.answers.preferredName ||
                                    "Member"}
                                </td>
                                <td>{p?.email || "Not recorded"}</td>
                                <td>
                                  {p?.academicYear ||
                                    application?.answers.academicYear ||
                                    "Not recorded"}
                                </td>
                                <td>{m.role}</td>
                                <td>{m.status}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              {chapterTab === "Chapter Profile" && isOfficer && (
                <section className="panel">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      await act({
                        action: "chapterProfile",
                        chapterId: active.id,
                        bio: f.get("bio"),
                        location: f.get("location"),
                        state: f.get("state"),
                        publicContact: f.get("publicContact"),
                        logoUrl: f.get("logoUrl"),
                        applicationsOpen: f.has("applicationsOpen"),
                        publicContactConfirmed: true,
                      });
                    }}
                  >
                    {[
                      ["bio", "Public description", active.bio],
                      ["location", "Location", active.location],
                      ["state", "State / province", active.state || ""],
                      [
                        "publicContact",
                        "Approved public contact email (optional)",
                        active.publicContact || "",
                      ],
                      [
                        "logoUrl",
                        "Public chapter logo URL (optional)",
                        active.logoUrl || "",
                      ],
                    ].map(([name, label, value]) => (
                      <Field key={name} label={label}>
                        <input
                          name={name}
                          defaultValue={value}
                          required={["bio", "location", "state"].includes(name)}
                        />
                      </Field>
                    ))}
                    <label className="check-label">
                      <input
                        name="applicationsOpen"
                        type="checkbox"
                        defaultChecked={active.applicationsOpen !== false}
                      />
                      Accept membership applications
                    </label>
                    <label className="check-label">
                      <input type="checkbox" required />I have permission to
                      publish these contact details and public fields.
                    </label>
                    <button className="button">Save public profile</button>
                  </form>
                </section>
              )}
              {chapterTab === "Arena" && (
                <section className="panel">
                  <h2>Chapter Arena activity</h2>
                  {state.participations
                    .filter((p) => p.chapterId === active.id)
                    .map((p) => {
                      const c = state.challenges.find(
                          (c) => c.id === p.challengeId,
                        ),
                        submission = state.submissions.find(
                          (s) => s.participationId === p.id,
                        );
                      return (
                        <div className="portal-list-line" key={p.id}>
                          <b>{c?.title}</b>
                          <Tag value={submission?.status || "ACCEPTED"} />
                        </div>
                      );
                    })}
                  <button className="button" onClick={() => go("arena")}>
                    Open Arena and My Challenges
                  </button>
                </section>
              )}
              {chapterTab === "Resources" && (
                <section className="panel">
                  <h2>Private chapter resources</h2>
                  {state.chapterResources
                    .filter((r) => r.chapterId === active.id)
                    .map((r) => (
                      <article className="portal-list-line" key={r.id}>
                        <b>{r.title}</b>
                        <p className="preserve">{r.content}</p>
                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open chapter document
                          </a>
                        )}
                      </article>
                    ))}
                  {isOfficer && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget,
                          f = new FormData(form);
                        if (
                          await act({
                            action: "chapterResource",
                            chapterId: active.id,
                            title: f.get("title"),
                            content: f.get("content"),
                            url: f.get("url"),
                          })
                        )
                          form.reset();
                      }}
                    >
                      <Field label="Resource title">
                        <input name="title" required />
                      </Field>
                      <Field label="Private chapter resource text">
                        <textarea name="content" required />
                      </Field>
                      <Field label="Document URL (optional)">
                        <input name="url" type="url" />
                      </Field>
                      <button className="button secondary">
                        Add chapter resource
                      </button>
                    </form>
                  )}
                  <div className="portal-section">
                    <button
                      className="text-button"
                      onClick={() => go("toolkit")}
                    >
                      <BookOpen size={17} /> Open national Toolkit
                    </button>
                  </div>
                </section>
              )}
              {chapterTab === "Opportunities" && (
                <section className="panel">
                  <h2>Serve and collaborate</h2>
                  <p>
                    Explore USM national challenges and interchapter service
                    opportunities in Arena.
                  </p>
                  <button className="button" onClick={() => go("arena")}>
                    Browse opportunities <ArrowUpRight size={16} />
                  </button>
                </section>
              )}
            </>
          )}
        </>
      )}
      {view === "admin" &&
        (actor.role === "ADMIN" ? (
          <>
            <Intro
              title="USM national administration."
              description="Human decisions, accountable chapters, and a connected national network."
            />
            <div className="portal-stats">
              {[
                ["Approved real chapters", state.networkStats?.chapters || 0],
                [
                  "Registered verified students",
                  state.networkStats?.students || 0,
                ],
                [
                  "Pending chapter proposals",
                  state.networkStats?.pendingChapters || 0,
                ],
                [
                  "Pending Arena evidence",
                  state.networkStats?.pendingEvidence || 0,
                ],
              ].map(([label, value]) => (
                <div className="panel" key={label}>
                  <b>{value}</b>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="notice">
              Sample chapter records and seeded achievements remain labeled as
              demonstration content. Approved real chapters are counted
              separately.
            </div>
            <div className="portal-actions">
              <button
                className="button secondary"
                onClick={() => go("directory")}
              >
                Chapter Directory
              </button>
              <button className="button secondary" onClick={() => go("review")}>
                Arena / Evidence / Feed / Toolkit review desk
              </button>
              <button
                className="button secondary"
                onClick={() => go("leaderboard")}
              >
                Leaderboard and point ledger
              </button>
            </div>
            <h2>New Chapter Applications</h2>
            <div className="stack portal-section">
              {state.chapterProposals.filter((p) => p.status !== "DRAFT")
                .length ? (
                state.chapterProposals
                  .filter((p) => p.status !== "DRAFT")
                  .map((p) => (
                    <ReviewProposal key={p.id} proposal={p} act={act} />
                  ))
              ) : (
                <div className="empty">
                  <ShieldCheck />
                  <p>No submitted chapter proposals yet.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty">
            <ShieldCheck />
            <h2>USM administrator access required.</h2>
          </div>
        ))}
      {view === "profile" && (
        <>
          <Intro
            title="Your student profile."
            description="Share only what your chapter needs. Your email and roles cannot be changed through this form."
          />
          <section className="panel">
            <p>
              Account email:{" "}
              {actor.email || profile?.email || "Fictional demo identity"}
            </p>
            <p>
              Access: {actor.role.toLowerCase()} ·{" "}
              {state.demo
                ? "Demonstration account"
                : actor.verified
                  ? "Account email verified"
                  : "Verification required"}
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await act({
                  action: "profile",
                  name: f.get("name"),
                  academicYear: f.get("academicYear"),
                  major: f.get("major"),
                });
              }}
            >
              <Field label="Preferred name">
                <input
                  name="name"
                  defaultValue={profile?.name || actor.name || ""}
                  required
                  maxLength={100}
                />
              </Field>
              <Field label="Academic year (optional)">
                <input
                  name="academicYear"
                  defaultValue={profile?.academicYear || ""}
                />
              </Field>
              <Field label="Major (optional)">
                <input name="major" defaultValue={profile?.major || ""} />
              </Field>
              <button className="button">Save profile</button>
            </form>
            <div className="portal-section row wrap">
              <button
                className="button secondary"
                onClick={() => go("password")}
              >
                Change password
              </button>
              <button
                className="text-button"
                onClick={async () => {
                  await fetch("/api/auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mode: "logout" }),
                  });
                  router.replace("/");
                  router.refresh();
                  location.reload();
                }}
              >
                Sign out
              </button>
            </div>
          </section>
        </>
      )}
      {view === "password" && (
        <>
          <Intro
            title="Choose a new password."
            description="Use at least 12 characters and a password unique to SSA Network."
          />
          <PasswordForm />
        </>
      )}
    </>
  );
}
function ApplicationForm({
  questions,
  initial,
  submit,
}: {
  questions: typeof membershipQuestions;
  initial?: Record<string, string>;
  submit: (values: Record<string, string>, send: boolean) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const button = (e.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement | null,
          send = button?.value === "submit";
        const f = new FormData(form);
        setBusy(true);
        try {
          await submit(
            Object.fromEntries(
              questions.map((q) => [q.key, String(f.get(q.key) || "")]),
            ),
            send,
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      {questions.map((q) => (
        <Field key={q.key} label={q.label + (q.required ? " *" : "")}>
          <textarea
            name={q.key}
            defaultValue={initial?.[q.key] || ""}
            rows={q.key === "motivation" || q.key === "reason" ? 3 : 1}
            maxLength={4000}
            required={q.required}
          />
        </Field>
      ))}
      <div className="row wrap">
        <button className="button secondary" value="draft" disabled={busy}>
          Save draft
        </button>
        <button className="button" value="submit" disabled={busy}>
          Submit application <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}
function AnswerList({ values }: { values: Record<string, string> }) {
  return (
    <dl className="application-answers">
      {Object.entries(values).map(([key, value]) => (
        <div key={key}>
          <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
          <dd>{value || "Not provided"}</dd>
        </div>
      ))}
    </dl>
  );
}
function ReviewApplication({
  application: a,
  act,
}: {
  application: MembershipApplication;
  act: Act;
}) {
  return (
    <article className="panel">
      <Tag value={a.status} />
      <h3>{a.answers.preferredName || "Student application"}</h3>
      <AnswerList values={a.answers} />
      {a.status === "PENDING" ? (
        <DecisionForm
          label="Membership decision"
          submit={(decision, note) =>
            act({
              action: "membershipReview",
              applicationId: a.id,
              decision,
              note,
            })
          }
        />
      ) : (
        <p>{a.reviewNote || "No review note."}</p>
      )}
    </article>
  );
}
function ReviewProposal({
  proposal: p,
  act,
}: {
  proposal: ChapterProposal;
  act: Act;
}) {
  return (
    <article className="panel">
      <Tag value={p.status} />
      <h3>{p.details.proposedName}</h3>
      <AnswerList values={p.details} />
      {p.status === "PENDING" ? (
        <>
          <div className="notice">
            Approval creates a USM-affiliated chapter and grants its applicant
            initial officer access. This does not establish university
            recognition.
          </div>
          <DecisionForm
            label="USM chapter decision"
            submit={(decision, note) =>
              act({
                action: "proposalReview",
                proposalId: p.id,
                decision,
                note,
              })
            }
          />
        </>
      ) : (
        <p>{p.reviewNote || "No review note."}</p>
      )}
    </article>
  );
}
function DecisionForm({
  label,
  submit,
}: {
  label: string;
  submit: (decision: string, note: string) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        try {
          await submit(String(f.get("decision")), String(f.get("note")));
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label={label}>
        <select name="decision" required defaultValue="">
          <option value="" disabled>
            Choose a decision…
          </option>
          <option value="APPROVED">Approve</option>
          <option value="CHANGES_REQUESTED">Request changes</option>
          <option value="DECLINED">Decline</option>
        </select>
      </Field>
      <Field label="Reviewer note (optional)">
        <textarea name="note" maxLength={2000} />
      </Field>
      <label className="check-label">
        <input type="checkbox" required />I reviewed this application and
        confirm this decision.
      </label>
      <button className="button" disabled={busy}>
        Confirm human decision
      </button>
    </form>
  );
}
function PasswordForm() {
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        if (f.get("password") !== f.get("confirm")) {
          setMessage("Passwords do not match.");
          return;
        }
        setBusy(true);
        try {
          const r = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "password",
              password: f.get("password"),
            }),
          });
          const data = await r.json();
          setMessage(data.error || data.message);
        } catch {
          setMessage("Password update failed. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label="New password">
        <input
          type="password"
          name="password"
          required
          minLength={12}
          autoComplete="new-password"
        />
      </Field>
      <Field label="Confirm new password">
        <input
          type="password"
          name="confirm"
          required
          minLength={12}
          autoComplete="new-password"
        />
      </Field>
      <button className="button" disabled={busy}>
        Update password
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
