"use client";
import {
  useCallback,
  useEffect,
  useState,
  useRef,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Heart,
  Compass,
  Trophy,
  BookOpen,
  Sparkles,
  Home,
  ShieldCheck,
  Users,
  MapPin,
  Clock,
  ChevronRight,
  CheckCircle2,
  X,
  Search,
  Plus,
  Menu,
  Globe,
  HandHeart,
  Flag,
  Check,
  LoaderCircle,
  LogIn,
  ExternalLink,
  GraduationCap,
} from "lucide-react";
import {
  categories,
  resourceCategories,
  type PublicState,
  type Challenge,
  type Document,
  type Submission,
} from "@/lib/types";
import { matching, score, semester, submissionContext } from "@/lib/domain";
import ReactMarkdown from "react-markdown";
import { AuthPanel, Portals } from "./portals";
type View =
  | "home"
  | "arena"
  | "leaderboard"
  | "feed"
  | "toolkit"
  | "sahayak"
  | "review"
  | "chapter"
  | "dashboard"
  | "directory"
  | "applications"
  | "start"
  | "myssa"
  | "admin"
  | "profile"
  | "password";
const nav = [
  ["home", "Overview", Home],
  ["arena", "Arena", Compass],
  ["leaderboard", "Leaderboard", Trophy],
  ["feed", "National feed", Globe],
  ["toolkit", "Toolkit", BookOpen],
  ["sahayak", "Sahayak", Sparkles],
] as const;
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const date = (s: string) =>
  new Date(s.length === 10 ? s + "T12:00:00Z" : s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  });
async function request(url: string, data?: unknown) {
  const res = await fetch(url, {
    method: data ? "POST" : "GET",
    headers: data ? { "Content-Type": "application/json" } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    cache: "no-store",
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.error || "Something went wrong.");
  return result;
}
function Badge({
  children,
  tone = "",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <div className="overlay" onClick={close}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={close}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function Values({ children }: { children: ReactNode }) {
  return <div className="values">{children}</div>;
}
export default function Network() {
  const [now] = useState(() => Date.now()),
    [state, setState] = useState<PublicState | null>(null),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [view, setView] = useState<View>("home"),
    [mobile, setMobile] = useState(false),
    [accountOpen, setAccountOpen] = useState(false),
    [identity, setIdentity] = useState(false),
    [detail, setDetail] = useState<Challenge | null>(null),
    [submission, setSubmission] = useState<string | null>(null),
    [resource, setResource] = useState<Document | null>(null),
    [chapterId, setChapterId] = useState<string | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!accountOpen) return;
    const outside = (e: PointerEvent) => {
      if (!accountRef.current?.contains(e.target as Node))
        setAccountOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAccountOpen(false);
        accountRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [accountOpen]);
  const [q, setQ] = useState(""),
    [category, setCategory] = useState("All categories"),
    [type, setType] = useState("All types"),
    [region, setRegion] = useState("All regions"),
    [reward, setReward] = useState("Any reward"),
    [deadline, setDeadline] = useState("Any deadline"),
    [status, setStatus] = useState("OPEN"),
    [arenaTab, setArenaTab] = useState("Discover"),
    [term, setTerm] = useState("Fall 2026");
  const refresh = useCallback(async () => {
    try {
      setState(await request("/api/state"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    if (
      location.hash.includes("access_token=") ||
      location.hash.includes("error_description=")
    ) {
      location.replace("/auth/callback" + location.search + location.hash);
      return;
    }
    queueMicrotask(() => void refresh());
    const sync = () => {
      const v = new URLSearchParams(location.search).get("view");
      if (
        nav.some((n) => n[0] === v) ||
        [
          "review",
          "chapter",
          "dashboard",
          "directory",
          "applications",
          "start",
          "myssa",
          "admin",
          "profile",
          "password",
        ].includes(v || "")
      )
        setView(v as View);
    };
    queueMicrotask(sync);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [refresh]);
  useEffect(() => {
    const update = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(update, 30000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (state) {
      const id = new URLSearchParams(location.search).get("resource");
      if (id) {
        const d = state.documents.find((d) => d.id === id);
        if (d) queueMicrotask(() => setResource(d));
      }
    }
  }, [state]);
  const go = (v: View) => {
    setAccountOpen(false);
    setView(v);
    setQ("");
    setCategory("All categories");
    setMobile(false);
    history.pushState({}, "", `/?view=${v}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const act = async (data: unknown) => {
    setBusy(true);
    try {
      const result = await request("/api/action", data);
      setToast(result.message);
      await refresh();
      return true;
    } catch (e) {
      setToast((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const portalAct = async (data: unknown) => {
    setBusy(true);
    try {
      const r = await request("/api/portal", data);
      setToast(r.message);
      await refresh();
      return true;
    } catch (e) {
      setToast((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const session = async (data: unknown) => {
    setBusy(true);
    try {
      const r = await request("/api/session", data);
      setToast(r.message);
      await refresh();
      setIdentity(false);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const chapter = state?.chapters.find((c) => c.id === state.actor.chapterId);
  const totalPoints = state?.points.reduce((n, p) => n + p.amount, 0) || 0;
  const pageTitle =
    nav.find((n) => n[0] === view)?.[1] ||
    {
      review: "USM review desk",
      chapter: "Chapter profile",
      dashboard: "My dashboard",
      directory: "Find your SSA",
      applications: "My applications",
      start: "Start a Chapter",
      myssa: "My SSA",
      admin: "USM administration",
      profile: "My profile",
      password: "Change password",
    }[view as string] ||
    "Your community";
  const showChallenge = (c: Challenge) => setDetail(c);
  const availability = (c: Challenge) => {
    const count =
      state?.participations.filter((p) => p.challengeId === c.id).length || 0;
    return c.status !== "OPEN"
      ? "Closed"
      : c.maxChapters
        ? count >= c.maxChapters
          ? "Claimed · view details"
          : `${c.maxChapters - count} of ${c.maxChapters} chapter places left`
        : "Open to multiple chapters";
  };
  const challengeCards = (items: Challenge[]) =>
    items.length ? (
      <div className="challenge-grid">
        {items.map((c, i) => (
          <article className="challenge-card" key={c.id}>
            <div className={"card-art art-" + (i % 4)}>
              <div className="art-grid" />
              <span className="art-word">{String(i + 1).padStart(2, "0")}</span>
              <span className="art-icon">
                {c.category === "Technology" ? (
                  <GraduationCap size={60} />
                ) : c.type === "National Challenge" ? (
                  <Flag size={60} />
                ) : (
                  <HandHeart size={60} />
                )}
              </span>
              <Badge>
                {c.type === "National Challenge"
                  ? "National challenge"
                  : "Community request"}
              </Badge>
            </div>
            <div className="card-content">
              <div className="row between">
                <span className="eyebrow category">{c.category}</span>
                <span className="reward">{c.points} pts</span>
              </div>
              <h3>{c.title}</h3>
              <p className="organization">{c.organization}</p>
              <div className="row wrap">
                <Badge>
                  {c.region === "National" ? "Nationwide" : c.region}
                </Badge>
                <Badge>
                  {c.maxChapters === 1
                    ? "One chapter"
                    : c.maxChapters
                      ? "Limited places"
                      : "Shared challenge"}
                </Badge>
                {c.sample !== false && <Badge>Fictional demo</Badge>}
              </div>
              <p className="clamp">{c.description}</p>
              <div className="card-meta">
                <span>
                  <MapPin size={14} />
                  {c.location}
                </span>
                <span>
                  <Clock size={14} />
                  {c.deadline ? date(c.deadline) : "Needs clarification"}
                </span>
              </div>
              {c.grant > 0 && (
                <p className="small">
                  <strong>{availability(c)}</strong>
                </p>
              )}
              {state?.participations.some(
                (p) =>
                  p.challengeId === c.id &&
                  p.chapterId === state.actor.chapterId,
              ) && (
                <Badge tone="gold">
                  Your chapter joined · see My Challenges
                </Badge>
              )}
              <div className="card-footer">
                <span>
                  {c.grant > 0 ? (
                    <Badge tone="gold">{money(c.grant)} grant record</Badge>
                  ) : (
                    <Badge tone="green">{availability(c)}</Badge>
                  )}
                </span>
                <button
                  className="text-button"
                  onClick={() => showChallenge(c)}
                >
                  View details <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="empty">
        <Search />
        <h3>No challenges found</h3>
        <p>Try a different search or clear your filters.</p>
      </div>
    );
  if (!state)
    return (
      <main className="boot">
        <div className="logo-mark">s.</div>
        <h1>SSA Network</h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button className="button" onClick={refresh}>
              Try again
            </button>
          </>
        ) : (
          <p>
            <LoaderCircle className="spin" /> Bringing the sangat together…
          </p>
        )}
      </main>
    );
  const ranking = state.chapters
    .map((c) => ({
      ...c,
      points: state.points
        .filter(
          (p) =>
            p.chapterId === c.id &&
            (term === "All semesters" || p.semester === term),
        )
        .reduce((n, p) => n + p.amount, 0),
      completed: state.points.filter(
        (p) =>
          p.chapterId === c.id &&
          (term === "All semesters" || p.semester === term),
      ).length,
    }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return (
    <div className="shell">
      <aside className={"sidebar " + (mobile ? "mobile-open" : "")}>
        <button className="brand" onClick={() => go("home")}>
          <span className="logo-mark">s.</span>
          <span>
            SSA Network<small>UNITED SIKH MOVEMENT</small>
          </span>
        </button>
        <div className="nav-label">THE CAMPUS NETWORK</div>
        <nav>
          <button
            className={"nav-item " + (view === "directory" ? "active" : "")}
            onClick={() => go("directory")}
          >
            <Users size={18} />
            Find your SSA
          </button>
          {nav.map(([id, label, Icon]) => (
            <button
              className={"nav-item " + (view === id ? "active" : "")}
              key={id}
              onClick={() => go(id)}
            >
              <Icon size={19} />
              {label}
              {id === "sahayak" && <span className="ai-mini">AI</span>}
            </button>
          ))}
        </nav>
        <div className="network-colophon">
          <span>EST. 2026 / USM</span>
          <p>
            Built by students.
            <br />
            Held together by seva.
          </p>
          <button onClick={() => go("directory")}>
            Find your chapter <ArrowUpRight size={14} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            aria-label="Toggle navigation"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <span className="mobile-brand">SSA Network</span>
          <span className="breadcrumb">
            Your community <ChevronRight size={13} /> <b>{pageTitle}</b>
          </span>
          <div className="account-area" ref={accountRef}>
            <span className="top-note">SEVA / SANGAT / VIDYA</span>
            <button
              className="top-profile"
              aria-expanded={
                state.actor.id !== "guest" ? accountOpen : undefined
              }
              aria-controls={
                state.actor.id !== "guest" ? "account-panel" : undefined
              }
              onClick={() =>
                state.actor.id === "guest"
                  ? setIdentity(true)
                  : setAccountOpen(!accountOpen)
              }
            >
              <span className="account-monogram" aria-hidden="true">
                {state.actor.name?.slice(0, 1).toUpperCase() ||
                  (state.actor.role === "ADMIN" ? "U" : "S")}
              </span>
              {state.actor.id === "guest"
                ? state.demo
                  ? "Enter demo"
                  : "Sign in / Join"
                : "My account"}
              <ChevronRight size={14} />
            </button>
            {accountOpen && state.actor.id !== "guest" && (
              <div
                className="account-panel"
                id="account-panel"
                aria-label="Account tools"
              >
                <div className="account-panel-heading">
                  <b>
                    {state.actor.name ||
                      (state.actor.role === "ADMIN"
                        ? "USM reviewer"
                        : "Your account")}
                  </b>
                  <span>
                    {state.actor.role === "ADMIN"
                      ? "USM administrator"
                      : state.actor.role === "OFFICER"
                        ? "Chapter officer"
                        : "Student"}
                  </span>
                  {chapter && <small>{chapter.name}</small>}
                </div>
                {[
                  ["dashboard", "My dashboard", Home],
                  ["myssa", "My SSA", Users],
                  ["applications", "My applications", BookOpen],
                  ["profile", "My profile", GraduationCap],
                ].map(([id, label, Icon]) => {
                  const I = Icon as typeof Home;
                  return (
                    <button key={String(id)} onClick={() => go(id as View)}>
                      <I size={17} />
                      {String(label)}
                      <ArrowUpRight size={13} />
                    </button>
                  );
                })}
                {state.actor.role === "ADMIN" && (
                  <div className="admin-tools">
                    <span>USM WORKSPACE</span>
                    <button onClick={() => go("admin")}>
                      <ShieldCheck size={17} />
                      USM administration
                      <ArrowUpRight size={13} />
                    </button>
                    <button onClick={() => go("review")}>
                      <CheckCircle2 size={17} />
                      USM review desk
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                )}
                {state.demo ? (
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      setIdentity(true);
                    }}
                  >
                    <LogIn size={17} />
                    Switch identity
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        await request("/api/auth", { mode: "logout" });
                        setAccountOpen(false);
                        await refresh();
                        go("home");
                      } catch (e) {
                        setToast((e as Error).message);
                      }
                    }}
                  >
                    <LogIn size={17} />
                    Sign out
                  </button>
                )}
              </div>
            )}
          </div>
        </header>
        {(state.demo || state.sampleData) && (
          <div className="demo-banner">
            <span>
              {state.demo ? "DEMONSTRATION" : "SAMPLE CONTENT · REAL ACCOUNTS"}
            </span>{" "}
            Fictional chapters, opportunities, and resources. Grant records are
            not payments.
          </div>
        )}
        <main className="content">
          {error && (
            <div className="alert" role="alert">
              {error}
            </div>
          )}
          {[
            "dashboard",
            "directory",
            "applications",
            "start",
            "myssa",
            "admin",
            "profile",
            "password",
          ].includes(view) && (
            <Portals
              view={view}
              state={state}
              go={(v) => go(v as View)}
              act={portalAct}
              onSignIn={() => setIdentity(true)}
            />
          )}
          {view === "home" && (
            <>
              <div className="page-intro">
                <div>
                  <div className="eyebrow">THE STUDENT COMMONS / ISSUE 01</div>
                  <h1>Your campus. Our community.</h1>
                  <p>
                    Find your SSA, share what works, and make something useful
                    happen together.
                  </p>
                </div>
                <Badge tone="outline">
                  <span className="live-dot" /> THE NATIONAL SSA COMMUNITY
                </Badge>
              </div>
              <div className="portal-actions">
                <button className="button" onClick={() => go("directory")}>
                  Join an SSA <ArrowRight size={16} />
                </button>
                <button
                  className="button secondary"
                  onClick={() => go("start")}
                >
                  Start a New SSA
                </button>
              </div>
              <section className="hero">
                <div className="hero-copy">
                  <Badge tone="hero-badge">THIS WEEK / THE ARENA</Badge>
                  <h2>
                    A little time.
                    <br />
                    <em>Something that matters.</em>
                  </h2>
                  <p>
                    Find a cause that moves you. Bring your chapter.
                    <br />
                    Turn your collective energy into meaningful seva.
                  </p>
                  <button
                    className="button saffron"
                    onClick={() => go("arena")}
                  >
                    Explore the Arena <ArrowUpRight size={18} />
                  </button>
                  <div className="hero-caption">
                    COMMUNITY REQUESTS + NATIONAL CHALLENGES
                  </div>
                </div>
                <div className="dispatch-board">
                  <span className="eyebrow">FIELD NOTES / START HERE</span>
                  <button onClick={() => go("directory")}>
                    <span>01</span>
                    <div>
                      <b>Find your people</b>
                      <small>
                        {state.chapters.length} campus chapters to explore
                      </small>
                    </div>
                    <ArrowUpRight size={20} />
                  </button>
                  <button onClick={() => go("arena")}>
                    <span>02</span>
                    <div>
                      <b>Put seva into practice</b>
                      <small>
                        {state.challenges.length} opportunities in the Arena
                      </small>
                    </div>
                    <ArrowUpRight size={20} />
                  </button>
                  <button onClick={() => go("feed")}>
                    <span>03</span>
                    <div>
                      <b>See what’s happening</b>
                      <small>Stories and projects from the network</small>
                    </div>
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </section>
              <div className="stats">
                <div>
                  <span className="stat-icon">
                    <GraduationCap />
                  </span>
                  <div>
                    <b>{state.chapters.length}</b>
                    <span>Connected chapters</span>
                  </div>
                </div>
                <div>
                  <span className="stat-icon">
                    <Compass />
                  </span>
                  <div>
                    <b>
                      {
                        state.challenges.filter((c) => c.status === "OPEN")
                          .length
                      }
                    </b>
                    <span>Opportunities to serve</span>
                  </div>
                </div>
                <div>
                  <span className="stat-icon">
                    <CheckCircle2 />
                  </span>
                  <div>
                    <b>{state.points.length}</b>
                    <span>Verified achievements</span>
                  </div>
                </div>
                <div>
                  <span className="stat-icon">
                    <Sparkles />
                  </span>
                  <div>
                    <b>{totalPoints.toLocaleString()}</b>
                    <span>Points of shared impact</span>
                  </div>
                </div>
              </div>
              <div className="section-heading">
                <div>
                  <div className="eyebrow">FIND YOUR NEXT ACT OF SEVA</div>
                  <h2>Purpose, waiting for you.</h2>
                </div>
                <button className="text-button" onClick={() => go("arena")}>
                  All opportunities <ArrowRight size={17} />
                </button>
              </div>
              {challengeCards(state.challenges.slice(0, 3))}
              <section className="bottom-callout">
                <BookOpen size={30} />
                <div>
                  <h3>You don’t have to start from scratch.</h3>
                  <p>
                    Event guides, handover checklists, and ideas to help your
                    chapter thrive.
                  </p>
                </div>
                <button
                  className="button secondary"
                  onClick={() => go("toolkit")}
                >
                  Open the Toolkit <ArrowUpRight size={17} />
                </button>
              </section>
            </>
          )}
          {view === "arena" && (
            <>
              <PageIntro
                eyebrow="THE ARENA"
                title="Find a cause. Make your mark."
                description="Real community needs. Shared national challenges. One place to turn seva into action."
              />
              <div className="tabs">
                {["Discover", "My Challenges"].map((t) => (
                  <button
                    key={t}
                    className={arenaTab === t ? "selected" : ""}
                    onClick={() => setArenaTab(t)}
                  >
                    {t}
                    {t === "My Challenges" && (
                      <span>
                        {
                          state.participations.filter(
                            (p) => p.chapterId === state.actor.chapterId,
                          ).length
                        }
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {arenaTab === "Discover" ? (
                <>
                  <div
                    className="arena-regions"
                    aria-label="Explore challenges by region"
                  >
                    {[
                      "National",
                      "West",
                      "Southeast",
                      "Midwest",
                      "Northeast",
                      "Southwest",
                    ].map((r, i) => (
                      <button
                        key={r}
                        className={
                          "region-tile region-" +
                          i +
                          (region === r ? " active" : "")
                        }
                        onClick={() =>
                          setRegion(region === r ? "All regions" : r)
                        }
                        aria-pressed={region === r}
                      >
                        <span className="region-symbol">
                          {["◎", "◒", "☀", "▦", "◈", "△"][i]}
                        </span>
                        <strong>
                          {r === "National" ? "Across the country" : r}
                        </strong>
                        <span>
                          {
                            state.challenges.filter((c) => c.region === r)
                              .length
                          }{" "}
                          opportunities
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="notice small">
                    Shared challenges stay open when another SSA joins. Limited
                    requests show how many chapter places remain. Each chapter
                    submits its own evidence for human review.
                  </div>
                  <div className="filters">
                    <label className="search">
                      <Search size={18} />
                      <input
                        aria-label="Search challenges"
                        placeholder="Search opportunities, organizations…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {["All categories", ...categories].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Challenge type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      {[
                        "All types",
                        "Community Request",
                        "National Challenge",
                      ].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Region"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                    >
                      {[
                        "All regions",
                        "West",
                        "Southeast",
                        "Midwest",
                        "Northeast",
                        "Southwest",
                        "National",
                      ].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Reward"
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                    >
                      {["Any reward", "Grant available", "200+ points"].map(
                        (v) => (
                          <option key={v}>{v}</option>
                        ),
                      )}
                    </select>
                    <select
                      aria-label="Deadline"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    >
                      {["Any deadline", "Next 30 days", "Next 60 days"].map(
                        (v) => (
                          <option key={v}>{v}</option>
                        ),
                      )}
                    </select>
                    <select
                      aria-label="Status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="OPEN">Open</option>
                      <option value="CLOSED">Closed</option>
                      <option value="ALL">All statuses</option>
                    </select>
                    <button
                      className="text-button"
                      onClick={() => {
                        setQ("");
                        setCategory("All categories");
                        setType("All types");
                        setRegion("All regions");
                        setReward("Any reward");
                        setDeadline("Any deadline");
                        setStatus("OPEN");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                  {(() => {
                    const filtered = state.challenges.filter(
                      (c) =>
                        (status === "ALL" || c.status === status) &&
                        (category === "All categories" ||
                          c.category === category) &&
                        (type === "All types" || c.type === type) &&
                        (region === "All regions" || c.region === region) &&
                        (reward === "Any reward" ||
                          (reward === "Grant available"
                            ? c.grant > 0
                            : c.points >= 200)) &&
                        (deadline === "Any deadline" ||
                          (c.deadline &&
                            Date.parse(c.deadline) >= now &&
                            Date.parse(c.deadline) - now <=
                              (deadline === "Next 30 days" ? 30 : 60) *
                                86400000)) &&
                        `${c.title} ${c.description} ${c.organization}`
                          .toLowerCase()
                          .includes(q.toLowerCase()),
                    );
                    return filtered.length
                      ? [
                          "National",
                          "West",
                          "Southeast",
                          "Midwest",
                          "Northeast",
                          "Southwest",
                        ].map((r) => {
                          const items = filtered.filter((c) => c.region === r);
                          return items.length ? (
                            <section className="arena-region-section" key={r}>
                              <div className="row between">
                                <h2>
                                  {r === "National"
                                    ? "Serve together, nationwide"
                                    : `${r} opportunities`}
                                </h2>
                                <span className="badge">
                                  {items.length} challenges
                                </span>
                              </div>
                              <p className="muted">
                                {r === "National"
                                  ? "Chapters across the country can contribute independently."
                                  : "Local needs and regional projects. Check each challenge’s eligibility."}
                              </p>
                              {challengeCards(items)}
                            </section>
                          ) : null;
                        })
                      : challengeCards([]);
                  })()}
                  <p className="muted small">
                    Cards labeled fictional demo are sample opportunities.
                    Points are awarded only after human verification.
                  </p>
                </>
              ) : (
                <div className="stack">
                  {state.actor.role !== "OFFICER" ? (
                    <div className="empty">
                      <Users />
                      <h3>Your chapter’s next chapter starts here.</h3>
                      <p>
                        Sign in as an authorized chapter officer to accept a
                        challenge and submit evidence.
                      </p>
                      <button
                        className="button"
                        onClick={() => setIdentity(true)}
                      >
                        Sign in / Account
                      </button>
                    </div>
                  ) : state.participations.filter(
                      (p) => p.chapterId === state.actor.chapterId,
                    ).length === 0 ? (
                    <div className="empty">
                      <Compass />
                      <h3>No accepted challenges yet</h3>
                      <button
                        className="button"
                        onClick={() => setArenaTab("Discover")}
                      >
                        Discover a challenge
                      </button>
                    </div>
                  ) : (
                    state.participations
                      .filter((p) => p.chapterId === state.actor.chapterId)
                      .map((p) => {
                        const c = state.challenges.find(
                            (c) => c.id === p.challengeId,
                          )!,
                          s = state.submissions.find(
                            (s) => s.participationId === p.id,
                          );
                        return (
                          <article className="panel participation" key={p.id}>
                            <div>
                              <Badge
                                tone={
                                  s?.status === "APPROVED" ? "green" : "gold"
                                }
                              >
                                {s?.status.replace("_", " ") || "ACCEPTED"}
                              </Badge>
                              <h3>{c.title}</h3>
                              <p>{c.completion}</p>
                              {s?.feedback && (
                                <div className="notice">
                                  Reviewer feedback: {s.feedback}
                                </div>
                              )}
                            </div>
                            <div className="row">
                              <button
                                className="button secondary"
                                onClick={() => setDetail(c)}
                              >
                                Requirements
                              </button>
                              {(!s ||
                                ["NEEDS_INFO", "REJECTED"].includes(
                                  s.status,
                                )) && (
                                <button
                                  className="button"
                                  onClick={() => setSubmission(p.id)}
                                >
                                  {s ? "Update evidence" : "Submit evidence"}{" "}
                                  <ArrowUpRight size={16} />
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })
                  )}
                </div>
              )}
            </>
          )}
          {view === "leaderboard" && (
            <>
              <PageIntro
                eyebrow="RECOGNITION WITH PURPOSE"
                title="Many chapters. Collective impact."
                description="Celebrating verified effort, thoughtful service, and the communities we build together."
              />
              <div className="notice">
                <ShieldCheck size={20} />
                <span>
                  Chapter recognition only. Every point follows human review.
                  Demo scoring is a proposal for USM’s consideration.
                </span>
              </div>
              <div className="section-heading">
                <h2>National chapter rankings</h2>
                <select
                  aria-label="Semester"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                >
                  {[
                    ...new Set([
                      "Fall 2026",
                      semester(new Date().toISOString()),
                      ...state.points.map((p) => p.semester),
                      "All semesters",
                    ]),
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="leaderboard panel">
                <div className="leader-row table-head">
                  <span>RANK</span>
                  <span>CHAPTER / UNIVERSITY</span>
                  <span>COMPLETED</span>
                  <span>POINTS</span>
                </div>
                {ranking.map((c, i) => (
                  <button
                    className="leader-row"
                    key={c.id}
                    onClick={() => setChapterId(c.id)}
                  >
                    <span className={"rank rank-" + i}>
                      {i === 0 ? (
                        <Trophy size={22} />
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    <span className="chapter-cell">
                      <span className="chapter-avatar">
                        {c.id.toUpperCase().slice(0, 2)}
                      </span>
                      <span>
                        <b>{c.name}</b>
                        <small>{c.university}</small>
                      </span>
                    </span>
                    <span>
                      {c.completed}{" "}
                      <span className="muted desktop-only">verified</span>
                    </span>
                    <span className="point-number">
                      {c.points.toLocaleString()} <ArrowUpRight size={14} />
                    </span>
                  </button>
                ))}
              </div>
              <div className="panel scoring">
                <h3>Effort deserves recognition.</h3>
                <p>
                  The demo score is{" "}
                  <code>round(base × effort × size factor)</code>. Effort = 1 +
                  0.25 × min(verified total volunteer-hours / 20, 1). Size
                  factor = √(40 / chapter size), bounded between 0.8 and 1.2.
                </p>
                <p>
                  Reported participant count never increases points. Reviewers
                  verify hours and inspect the calculated score. Each submission
                  earns at most one ledger entry. These settings are defined in{" "}
                  <code>lib/domain.ts</code> and need USM approval before real
                  use.
                </p>
              </div>
            </>
          )}
          {view === "feed" && (
            <>
              <PageIntro
                eyebrow="THE NATIONAL FEED"
                title="Look what we’re building together."
                description="Stories of service, campus connections, and small moments that move us forward."
              />
              {state.actor.role === "OFFICER" && (
                <PostForm busy={busy} act={act} />
              )}
              <div className="feed-layout">
                <div className="stack">
                  {state.posts
                    .filter((p) => p.status === "PUBLISHED")
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((p) => {
                      const c = state.chapters.find(
                          (c) => c.id === p.chapterId,
                        )!,
                        liked = state.reactions.some(
                          (r) =>
                            r.postId === p.id && r.userId === state.actor.id,
                        );
                      return (
                        <article className="panel feed-post" key={p.id}>
                          <div className="row between">
                            <button
                              className="chapter-link"
                              onClick={() => setChapterId(c.id)}
                            >
                              <span className="chapter-avatar">
                                {c.id.toUpperCase().slice(0, 2)}
                              </span>
                              <span>
                                <b>{c.name}</b>
                                <small>
                                  {c.university} · {date(p.createdAt)}
                                </small>
                              </span>
                            </button>
                            {p.verified && (
                              <Badge tone="green">
                                <ShieldCheck size={13} /> Verified impact
                              </Badge>
                            )}
                          </div>
                          <div className="feed-category">{p.category}</div>
                          <h2>{p.title}</h2>
                          <p className="preserve">{p.description}</p>
                          <div className="feed-footer">
                            <button
                              className={"reaction " + (liked ? "liked" : "")}
                              onClick={() =>
                                act({ action: "react", postId: p.id })
                              }
                              disabled={busy}
                              aria-pressed={liked}
                            >
                              <Heart
                                size={18}
                                fill={liked ? "currentColor" : "none"}
                              />{" "}
                              Shabash{" "}
                              <b>
                                {
                                  state.reactions.filter(
                                    (r) => r.postId === p.id,
                                  ).length
                                }
                              </b>
                            </button>
                            <span className="muted small">
                              A little appreciation goes a long way.
                            </span>
                          </div>
                        </article>
                      );
                    })}
                  {state.posts
                    .filter(
                      (p) =>
                        p.status !== "PUBLISHED" &&
                        p.chapterId === state.actor.chapterId,
                    )
                    .map((p) => (
                      <article className="panel" key={p.id}>
                        <Badge>{p.status}</Badge>
                        <h3>{p.title}</h3>
                        <p>{p.moderation}</p>
                      </article>
                    ))}
                </div>
                <aside className="feed-aside panel">
                  <span className="tiny-star">✦</span>
                  <h2>
                    Give good work
                    <br />a little Shabash.
                  </h2>
                  <p>
                    A shared celebration of our community. No public comments.
                    Just encouragement, connection, and collective pride.
                  </p>
                  <button className="text-button" onClick={() => go("arena")}>
                    Find your own next step <ArrowRight size={16} />
                  </button>
                </aside>
              </div>
            </>
          )}
          {view === "toolkit" && (
            <>
              <PageIntro
                eyebrow="THE TOOLKIT"
                title="Build on what came before."
                description="Practical resources for the first-time volunteer, the new officer, and every chapter in between."
              />
              <div className="notice">
                <BookOpen size={20} />
                <span>
                  Initial resources are fictional samples, not USM documents.
                  Approved public documents can be imported by a reviewer.
                </span>
              </div>
              <div className="filters">
                <label className="search">
                  <Search size={18} />
                  <input
                    aria-label="Search Toolkit"
                    placeholder="Search guides, templates, and ideas…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </label>
                <select
                  aria-label="Resource category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {["All categories", ...resourceCategories].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="resource-grid">
                {state.documents
                  .filter(
                    (d) =>
                      (category === "All categories" ||
                        d.category === category) &&
                      `${d.title} ${d.description} ${d.content}`
                        .toLowerCase()
                        .includes(q.toLowerCase()),
                  )
                  .map((d) => (
                    <button
                      className="panel resource-card"
                      key={d.id}
                      onClick={() => setResource(d)}
                    >
                      <div className="row between">
                        <span className="resource-icon">
                          <BookOpen size={24} />
                        </span>
                        <ArrowUpRight size={20} />
                      </div>
                      <div className="eyebrow">{d.category}</div>
                      <h3>{d.title}</h3>
                      <p>{d.description}</p>
                      <div className="resource-footer">
                        <Badge tone={d.sample ? "gold" : "green"}>
                          {d.sample ? "Fictional sample" : "Approved resource"}
                        </Badge>
                        <span>
                          {d.updatedAt ? date(d.updatedAt) : "Date unknown"}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </>
          )}
          {view === "sahayak" && (
            <Sahayak
              configured={state.aiConfigured}
              onIdentity={() => setIdentity(true)}
              guest={state.actor.id === "guest"}
            />
          )}
          {view === "review" &&
            (state.actor.role === "ADMIN" ? (
              <ReviewDesk state={state} act={act} busy={busy} />
            ) : (
              <div className="empty">
                <ShieldCheck />
                <h2>USM reviewer access required</h2>
                <p>
                  Reviewer actions are protected by server-side authorization.
                </p>
                <button className="button" onClick={() => setIdentity(true)}>
                  Sign in
                </button>
              </div>
            ))}
          {view === "chapter" && chapter && (
            <>
              <PageIntro
                eyebrow="YOUR CHAPTER"
                title={chapter.name}
                description={chapter.bio}
              />
              <div className="panel">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    await act({
                      action: "chapter",
                      bio: f.get("bio"),
                      size: Number(f.get("size")),
                      availability: f.get("availability") || null,
                    });
                  }}
                >
                  <Field label="About your chapter">
                    <textarea name="bio" defaultValue={chapter.bio} required />
                  </Field>
                  <Field label="Chapter size (used in demo scoring)">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      name="size"
                      defaultValue={chapter.size}
                      required
                    />
                  </Field>
                  <Field label="Availability (blank means unknown)">
                    <input
                      name="availability"
                      defaultValue={chapter.availability || ""}
                    />
                  </Field>
                  <button className="button" disabled={busy}>
                    Save chapter
                  </button>
                </form>
                <h3>Financial summary</h3>
                <p>
                  {money(
                    state.grants
                      .filter((g) => g.chapterId === chapter.id)
                      .reduce((n, g) => n + g.amount, 0),
                  )}{" "}
                  in awarded grant tracking records. No payments have been
                  processed.
                </p>
              </div>
            </>
          )}
          <footer className="footer">
            <span>
              SSA Network <span className="muted">/</span> Rooted in seva. Built
              for sangat.
            </span>
            <span>Built for Sarbat Build Day 2026 · USM</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          <button aria-label="Dismiss message" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {identity && (
        <Modal
          title={
            state.demo ? "Choose your demo identity" : "Welcome to SSA Network"
          }
          close={() => setIdentity(false)}
        >
          {state.demo ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void session({
                  role: f.get("role"),
                  chapterId: f.get("chapterId"),
                  passcode: f.get("passcode"),
                });
              }}
            >
              <p className="muted">
                Fictional identities affect only this demonstration. Reviewer
                access requires the private server passcode.
              </p>
              <Field label="Role">
                <select name="role" defaultValue={state.actor.role}>
                  <option value="STUDENT">Student explorer</option>
                  <option value="OFFICER">Chapter officer</option>
                  <option value="ADMIN">
                    USM reviewer (passcode required)
                  </option>
                </select>
              </Field>
              <Field label="Officer’s chapter">
                <select
                  name="chapterId"
                  defaultValue={state.actor.chapterId || "uw"}
                >
                  {state.chapters.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Private reviewer passcode (reviewers only)">
                <input
                  name="passcode"
                  type="password"
                  autoComplete="current-password"
                />
              </Field>
              <div className="row">
                <button disabled={busy} className="button">
                  Enter demonstration <ArrowRight size={16} />
                </button>
                {chapter && (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      setIdentity(false);
                      go("chapter");
                    }}
                  >
                    My chapter
                  </button>
                )}
              </div>
            </form>
          ) : (
            <AuthPanel
              onSignedIn={async () => {
                await refresh();
                setIdentity(false);
                go("dashboard");
              }}
            />
          )}
        </Modal>
      )}
      {detail && (
        <Modal title={detail.title} close={() => setDetail(null)}>
          <div className="row wrap">
            <Badge>{detail.type}</Badge>
            <Badge tone="gold">{detail.points} base points</Badge>
            <Badge tone="green">{availability(detail)}</Badge>
          </div>
          <p className="lead">{detail.description}</p>
          <p className="muted">{detail.organization}</p>
          <Values>
            <div>
              <span>LOCATION / REGION</span>
              <b>
                {detail.location} · {detail.region}
              </b>
            </div>
            <div>
              <span>DEADLINE</span>
              <b>
                {detail.deadline
                  ? date(detail.deadline)
                  : "Needs clarification"}
              </b>
            </div>
            <div>
              <span>VOLUNTEERS</span>
              <b>{detail.volunteers ?? "Needs clarification"}</b>
            </div>
            <div>
              <span>GRANT RECORD</span>
              <b>{money(detail.grant)} · No payment</b>
            </div>
          </Values>
          <p className="notice">
            {detail.maxChapters === 1
              ? "One chapter can claim this request."
              : detail.maxChapters
                ? `Up to ${detail.maxChapters} chapters can participate.`
                : "Multiple chapters can take part independently."}{" "}
            {detail.restrictRegion && detail.region !== "National"
              ? `Limited to ${detail.region} chapters.`
              : "Chapters from any region may participate if they meet the requirements."}{" "}
            Rewards are awarded once per chapter after approval.
          </p>
          <h3>Who can take part</h3>
          <p>{detail.eligibility}</p>
          <h3>What completion looks like</h3>
          <p>{detail.completion}</p>
          <h3>What to submit</h3>
          <p>{detail.instructions}</p>
          <h3>Grant eligibility</h3>
          <p>{detail.grantEligibility}</p>
          <div className="notice small">
            Rewards require human verification. Grant awards are tracking
            records, not payments.
          </div>
          <div className="row wrap">
            <button
              disabled={
                busy ||
                detail.status !== "OPEN" ||
                (!state.participations.some(
                  (p) =>
                    p.chapterId === state.actor.chapterId &&
                    p.challengeId === detail.id,
                ) &&
                  ((!!detail.maxChapters &&
                    state.participations.filter(
                      (p) => p.challengeId === detail.id,
                    ).length >= detail.maxChapters) ||
                    (!!detail.restrictRegion &&
                      detail.region !== "National" &&
                      state.actor.role === "OFFICER" &&
                      state.chapters.find((c) => c.id === state.actor.chapterId)
                        ?.region !== detail.region))) ||
                (!state.demo &&
                  state.actor.id !== "guest" &&
                  state.actor.role !== "OFFICER")
              }
              className="button"
              onClick={async () => {
                if (state.actor.role !== "OFFICER") {
                  setIdentity(true);
                  setDetail(null);
                  return;
                }
                if (await act({ action: "accept", challengeId: detail.id })) {
                  setDetail(null);
                  go("arena");
                  setArenaTab("My Challenges");
                }
              }}
            >
              {state.participations.some(
                (p) =>
                  p.chapterId === state.actor.chapterId &&
                  p.challengeId === detail.id,
              )
                ? "Open My Challenges"
                : !state.demo &&
                    state.actor.id !== "guest" &&
                    state.actor.role !== "OFFICER"
                  ? "Chapter officer access required"
                  : "Accept for my chapter"}{" "}
              <ArrowUpRight size={16} />
            </button>
            <button
              disabled={
                busy || state.interests.some((i) => i.challengeId === detail.id)
              }
              className="button secondary"
              onClick={() =>
                act({ action: "interest", challengeId: detail.id })
              }
            >
              {state.interests.some((i) => i.challengeId === detail.id) ? (
                <>
                  <Check size={16} /> Interest saved
                </>
              ) : (
                "I’m interested"
              )}
            </button>
          </div>
          <h3>Suggested chapter matches</h3>
          <p className="muted small">
            Deterministic recommendations using fictional chapter data. Calendar
            and exam availability may be unknown.
          </p>
          {matching(detail, state.chapters)
            .slice(0, 3)
            .map((m) => (
              <div className="match" key={m.chapter.id}>
                <b>{m.chapter.name}</b>
                <ul>
                  {m.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            ))}
        </Modal>
      )}
      {submission && (
        <Modal
          title="Share your chapter’s impact"
          close={() => setSubmission(null)}
        >
          <p>
            Evidence stays in the reviewer workflow. Do not include private
            student or recipient data. Share a document or image link with
            reviewer access; files are not uploaded to this demo.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await act({
                  action: "submit",
                  participationId: submission,
                  summary: f.get("summary"),
                  impact: f.get("impact"),
                  evidence: f.get("evidence"),
                  attachment: f.get("attachment"),
                  participants: Number(f.get("participants")),
                  hours: Number(f.get("hours")),
                })
              )
                setSubmission(null);
            }}
          >
            {["summary", "impact", "evidence"].map((n) => (
              <Field
                key={n}
                label={
                  n === "summary"
                    ? "What did you complete?"
                    : n === "impact"
                      ? "What changed for the community?"
                      : "Evidence and completion criteria (include supporting links)"
                }
              >
                <textarea
                  required
                  name={n}
                  maxLength={n === "evidence" ? 6000 : 4000}
                />
              </Field>
            ))}
            <Field label="Optional document or image URL">
              <input type="url" name="attachment" placeholder="https://…" />
            </Field>
            <div className="two-col">
              <Field label="Participants">
                <input
                  name="participants"
                  type="number"
                  min="1"
                  max="1000"
                  required
                />
              </Field>
              <Field label="Total volunteer-hours (not hours per person)">
                <input
                  name="hours"
                  type="number"
                  min="0.5"
                  max="10000"
                  step="0.5"
                  required
                />
              </Field>
            </div>
            <button className="button" disabled={busy}>
              Submit for human review <ArrowRight size={16} />
            </button>
          </form>
        </Modal>
      )}
      {resource && (
        <Modal
          title={resource.title}
          close={() => {
            setResource(null);
            history.replaceState({}, "", "/?view=toolkit");
          }}
        >
          <Badge tone={resource.sample ? "gold" : "green"}>
            {resource.sample
              ? "Fictional sample — not a USM document"
              : "Approved public resource"}
          </Badge>
          <p className="muted">
            {resource.source} · {resource.updatedAt || "Last updated unknown"}
          </p>
          <p className="lead">{resource.description}</p>
          <p className="document-content">{resource.content}</p>
          {resource.url && (
            <a
              className="button"
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open source document <ExternalLink size={16} />
            </a>
          )}
        </Modal>
      )}
      {chapterId &&
        (() => {
          const c = state.chapters.find((c) => c.id === chapterId)!;
          return (
            <Modal title={c.name} close={() => setChapterId(null)}>
              <Badge>Fictional demonstration chapter</Badge>
              <p>
                {c.university} · {c.location}
              </p>
              <p>{c.bio}</p>
              <Values>
                <div>
                  <span>VERIFIED POINTS</span>
                  <b>
                    {state.points
                      .filter((p) => p.chapterId === c.id)
                      .reduce((n, p) => n + p.amount, 0)}
                  </b>
                </div>
                <div>
                  <span>GRANT TRACKING BALANCE</span>
                  <b>
                    {money(
                      state.grants
                        .filter((g) => g.chapterId === c.id)
                        .reduce((n, g) => n + g.amount, 0),
                    )}
                  </b>
                </div>
              </Values>
              <p className="muted">
                Grant records do not represent transferred money.
              </p>
              <h3>Point ledger</h3>
              {state.points
                .filter((p) => p.chapterId === c.id)
                .map((p) => (
                  <div className="ledger-line" key={p.id}>
                    <span>
                      {p.semester} · {date(p.createdAt)}
                    </span>
                    <b>+{p.amount} pts</b>
                  </div>
                ))}
              {!state.points.some((p) => p.chapterId === c.id) && (
                <p>No verified awards yet.</p>
              )}
            </Modal>
          );
        })()}
    </div>
  );
}
function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
function PostForm({
  busy,
  act,
}: {
  busy: boolean;
  act: (data: unknown) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="panel compose">
      {!open ? (
        <button className="text-button" onClick={() => setOpen(true)}>
          <Plus size={18} /> Share a story from your chapter
        </button>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            if (
              await act({
                action: "post",
                title: f.get("title"),
                description: f.get("description"),
                category: f.get("category"),
              })
            )
              setOpen(false);
          }}
        >
          <h3>Propose a community post</h3>
          <p className="muted small">
            Public captions require human review. AI screening flags concerns
            when configured.
          </p>
          <Field label="Title">
            <input required name="title" maxLength={150} />
          </Field>
          <Field label="Caption">
            <textarea required name="description" />
          </Field>
          <Field label="Category">
            <select name="category">
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <button className="button" disabled={busy}>
            Submit for review
          </button>{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
function Sahayak({
  configured,
  guest,
  onIdentity,
}: {
  configured: boolean;
  guest: boolean;
  onIdentity: () => void;
}) {
  const [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState(""),
    [citations, setCitations] = useState<
      { id: string; title: string; url: string; sample: boolean }[]
    >([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await request("/api/ai", { mode: "chat", question });
      setAnswer(result.answer);
      setCitations(result.citations);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="sahayak">
      <div className="sahayak-icon">
        <Sparkles size={34} />
      </div>
      <div className="eyebrow">MEET SAHAYAK</div>
      <h1>What are you planning?</h1>
      <p className="muted">
        Ask Sahayak. Start with the guides. Make it your own.
      </p>
      {!configured && (
        <div className="notice">
          <ShieldCheck size={20} />
          <span>
            AI setup required: add <code>ANTHROPIC_API_KEY</code> on the server.
            Sahayak will never pretend to generate an AI answer without it.
          </span>
        </div>
      )}
      <div className="prompt-grid">
        {[
          "How do we organize a langar seva event?",
          "Help me draft a campus event budget.",
          "Write a draft sponsorship email.",
          "What should a new SSA president do first?",
        ].map((p) => (
          <button key={p} onClick={() => setQuestion(p)}>
            {p}
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>
      <form className="ask-box" onSubmit={submit}>
        <textarea
          aria-label="Ask Sahayak"
          placeholder="What would you like to bring to life?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          minLength={3}
          maxLength={4000}
        />
        <div className="row between">
          <span>
            <BookOpen size={14} /> Searches approved Toolkit sources
          </span>
          {guest ? (
            <button type="button" className="button" onClick={onIdentity}>
              Sign in
            </button>
          ) : (
            <button className="button" disabled={busy || !configured}>
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Sparkles size={17} />
              )}{" "}
              Ask Sahayak
            </button>
          )}
        </div>
      </form>
      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}
      {answer && (
        <article className="panel answer">
          <Badge tone="green">Sahayak · Advisory guidance</Badge>
          <div className="markdown-answer">
            <ReactMarkdown skipHtml>{answer}</ReactMarkdown>
          </div>
          <h4>Retrieved sources used</h4>
          {citations.length ? (
            citations.map((c) => (
              <a className="citation" key={c.id} href={c.url}>
                <BookOpen size={16} />
                {c.title} {c.sample && <Badge>Fictional sample</Badge>}
                <ArrowUpRight size={14} />
              </a>
            ))
          ) : (
            <p>No relevant source cited. Treat this as general guidance.</p>
          )}
        </article>
      )}
      <p className="small muted">
        Powered by Claude. Review generated advice. Plans, budgets, and emails
        are drafts requiring your approval.
      </p>
    </div>
  );
}
function ReviewDesk({
  state,
  act,
  busy,
}: {
  state: PublicState;
  act: (data: unknown) => Promise<boolean>;
  busy: boolean;
}) {
  const [tab, setTab] = useState("Submissions"),
    [extract, setExtract] = useState(""),
    [extractBusy, setExtractBusy] = useState(false),
    [extractError, setExtractError] = useState(""),
    [draft, setDraft] = useState<Record<string, unknown>>({}),
    [missing, setMissing] = useState<string[]>([]);
  const extractRequest = async () => {
    setExtractBusy(true);
    setExtractError("");
    try {
      const r = await request("/api/ai", { mode: "extract", message: extract });
      setDraft(r.extraction);
      setMissing(r.extraction.missingInformation);
    } catch (e) {
      setExtractError((e as Error).message);
    } finally {
      setExtractBusy(false);
    }
  };
  return (
    <>
      <PageIntro
        eyebrow="HUMAN JUDGMENT. SHARED TRUST."
        title="The USM review desk."
        description="Verify the work. Recognize the effort. Keep the community accountable."
      />
      <div className="tabs">
        {[
          "Submissions",
          "Community requests",
          "Public captions",
          "Import resources",
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "selected" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Submissions" && (
        <div className="stack">
          {state.submissions.filter((s) => s.status === "PENDING").length ===
            0 && (
            <div className="empty">
              <CheckCircle2 />
              <h3>You’re all caught up.</h3>
              <p>
                Pending chapter submissions will appear here for human review.
              </p>
            </div>
          )}
          {state.submissions
            .filter((s) => s.status === "PENDING")
            .map((s) => (
              <SubmissionReview
                key={s.id}
                state={state}
                submission={s}
                busy={busy}
                act={act}
              />
            ))}
          <h3>Review history</h3>
          {state.submissions
            .filter((s) => s.status !== "PENDING")
            .map((s) => (
              <div className="panel" key={s.id}>
                <Badge tone={s.status === "APPROVED" ? "green" : "gold"}>
                  {s.status}
                </Badge>
                <h3>{submissionContext(state, s).challenge.title}</h3>
                <p>
                  {submissionContext(state, s).chapter.name} · {s.feedback}
                </p>
              </div>
            ))}
        </div>
      )}
      {tab === "Community requests" && (
        <div className="panel">
          <h2>From a real need to a clear next step.</h2>
          <p className="muted">
            Paste English, Punjabi, or Pinglish. Claude extracts a draft; you
            confirm every fact before publishing. Missing facts need
            clarification.
          </p>
          <Field label="Original community message">
            <textarea
              value={extract}
              onChange={(e) => setExtract(e.target.value)}
              placeholder="Paste a community request…"
              maxLength={12000}
            />
          </Field>
          <button
            className="button secondary"
            onClick={extractRequest}
            disabled={extractBusy || !extract.trim() || !state.aiConfigured}
          >
            {extractBusy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Sparkles size={16} />
            )}{" "}
            Extract with Claude
          </button>
          {!state.aiConfigured && (
            <p className="small muted">
              AI is not configured. You can still enter and confirm the request
              manually below.
            </p>
          )}
          {extractError && <p className="alert">{extractError}</p>}
          {missing.length > 0 && (
            <div className="notice">
              Needs clarification: {missing.join("; ")}
            </div>
          )}
          <hr />
          <form
            key={JSON.stringify(draft)}
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const data = Object.fromEntries(f.entries());
              if (
                await act({
                  ...data,
                  action: "publish",
                  points: Number(f.get("points")),
                  grant: Number(f.get("grant")),
                  sample: f.get("sample") === "on",
                  maxChapters: f.get("maxChapters")
                    ? Number(f.get("maxChapters"))
                    : null,
                  restrictRegion: f.get("restrictRegion") === "on",
                  volunteers: f.get("volunteers")
                    ? Number(f.get("volunteers"))
                    : null,
                })
              ) {
                setDraft({});
                setExtract("");
                setMissing([]);
              }
            }}
          >
            <div className="two-col">
              <Field label="Title / requested activity">
                <input
                  name="title"
                  defaultValue={String(draft.activity || "")}
                  maxLength={150}
                  required
                  placeholder="Needs clarification"
                />
              </Field>
              <Field label="Requesting organization">
                <input
                  name="organization"
                  defaultValue={String(draft.organization || "")}
                  required
                  placeholder="Needs clarification"
                />
              </Field>
              <Field label="Challenge type">
                <select name="type">
                  <option>Community Request</option>
                  <option>National Challenge</option>
                </select>
              </Field>
              <Field label="Category">
                <select
                  name="category"
                  defaultValue={
                    categories.includes(
                      draft.category as (typeof categories)[number],
                    )
                      ? String(draft.category)
                      : "Other"
                  }
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Location">
                <input
                  name="location"
                  defaultValue={String(draft.location || "")}
                  required
                  placeholder="Needs clarification"
                />
              </Field>
              <Field label="Region">
                <select name="region">
                  {[
                    "West",
                    "Southeast",
                    "Midwest",
                    "Northeast",
                    "Southwest",
                    "National",
                  ].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Deadline (confirm exact date)">
                <input
                  name="deadline"
                  type="date"
                  defaultValue={String(draft.deadline || "")}
                  required
                />
              </Field>
              <Field label="Volunteers needed (optional if unknown)">
                <input
                  name="volunteers"
                  type="number"
                  min="1"
                  max="10000"
                  defaultValue={
                    draft.volunteers ? Number(draft.volunteers) : ""
                  }
                />
              </Field>
              <label className="check-label">
                <input name="sample" type="checkbox" /> Fictional demo /
                rehearsal challenge
              </label>
              <Field label="Maximum participating chapters (blank = unlimited)">
                <input
                  name="maxChapters"
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="Unlimited · enter 1 for a one-time request"
                />
              </Field>
              <label className="check-label">
                <input name="restrictRegion" type="checkbox" /> Limit
                participation to the selected region (National allows all
                regions)
              </label>
              <Field label="Base points (demo setting)">
                <input
                  name="points"
                  type="number"
                  min="1"
                  max="1000"
                  required
                  defaultValue="200"
                />
              </Field>
              <Field label="Grant amount in USD (tracking only)">
                <input
                  name="grant"
                  type="number"
                  min="0"
                  max="10000"
                  required
                  defaultValue="0"
                />
              </Field>
            </div>
            {[
              ["description", "Description"],
              ["eligibility", "Eligibility / required skills"],
              ["completion", "Definition of completion"],
              ["instructions", "Evidence submission instructions"],
              ["grantEligibility", "Grant eligibility (or no grant)"],
            ].map(([name, label]) => (
              <Field key={name} label={label}>
                <textarea
                  name={name}
                  required
                  defaultValue={
                    name === "eligibility" ? String(draft.skills || "") : ""
                  }
                />
              </Field>
            ))}
            <label className="check-label">
              <input type="checkbox" required /> I confirmed these details and
              have authority to publish this challenge.
            </label>
            <button className="button" disabled={busy}>
              Confirm and publish challenge <ArrowUpRight size={16} />
            </button>
          </form>
        </div>
      )}
      {tab === "Public captions" && (
        <div className="stack">
          {state.posts
            .filter((p) => ["PENDING", "FLAGGED"].includes(p.status))
            .map((p) => (
              <article className="panel" key={p.id}>
                <Badge tone="gold">{p.status}</Badge>
                <h3>{p.title}</h3>
                <p className="preserve">{p.description}</p>
                <div className="notice">Screening: {p.moderation}</div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    void act({
                      action: "moderate",
                      postId: p.id,
                      publish: f.get("decision") === "publish",
                      feedback: f.get("feedback"),
                    });
                  }}
                >
                  <Field label="Human review feedback">
                    <textarea name="feedback" required />
                  </Field>
                  <Field label="Decision">
                    <select name="decision">
                      <option value="reject">Reject</option>
                      <option value="publish">Approve for publication</option>
                    </select>
                  </Field>
                  <button className="button" disabled={busy}>
                    Save moderation decision
                  </button>
                </form>
              </article>
            ))}
          {!state.posts.some((p) =>
            ["PENDING", "FLAGGED"].includes(p.status),
          ) && (
            <div className="empty">
              <ShieldCheck />
              <h3>No captions awaiting review.</h3>
            </div>
          )}
        </div>
      )}
      {tab === "Import resources" && (
        <div className="panel">
          <h2>Add an approved public resource</h2>
          <p className="muted">
            Paste document text for search and retrieval. Google Drive links
            alone do not import their contents. Exclude student records, contact
            lists, confidential finances, and private information.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget,
                f = new FormData(form);
              if (
                await act({
                  action: "import",
                  title: f.get("title"),
                  description: f.get("description"),
                  category: f.get("category"),
                  source: f.get("source"),
                  url: f.get("url"),
                  content: f.get("content"),
                  approvedForPublic: true,
                })
              )
                form.reset();
            }}
          >
            {[
              ["title", "Title"],
              ["description", "Description"],
              ["source", "Source / owner"],
            ].map(([name, label]) => (
              <Field key={name} label={label}>
                <input name={name} required />
              </Field>
            ))}
            <Field label="Category">
              <select name="category">
                {resourceCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Original public document URL (optional)">
              <input name="url" type="url" />
            </Field>
            <Field label="Approved document text">
              <textarea name="content" required maxLength={60000} rows={10} />
            </Field>
            <label className="check-label">
              <input type="checkbox" required /> I have permission to publish
              this content and checked it for private information.
            </label>
            <button disabled={busy} className="button">
              Import public resource
            </button>
          </form>
        </div>
      )}
    </>
  );
}
function SubmissionReview({
  state,
  submission: s,
  act,
  busy,
}: {
  state: PublicState;
  submission: Submission;
  act: (data: unknown) => Promise<boolean>;
  busy: boolean;
}) {
  const { chapter, challenge: c } = submissionContext(state, s);
  const [hours, setHours] = useState(s.hours),
    [grant, setGrant] = useState(false);
  return (
    <article className="panel review-card">
      <div className="row between">
        <Badge tone="gold">PENDING HUMAN REVIEW</Badge>
        <span className="muted small">{date(s.createdAt)}</span>
      </div>
      <h2>{c.title}</h2>
      <p className="muted">
        {chapter.name} · {chapter.size} chapter members
      </p>
      <div className="review-criteria">
        <h4>Completion criteria</h4>
        <p>{c.completion}</p>
        <h4>Submission instructions</h4>
        <p>{c.instructions}</p>
      </div>
      <h4>Submitted work</h4>
      <p className="preserve">{s.summary}</p>
      <h4>Impact</h4>
      <p className="preserve">{s.impact}</p>
      <h4>Evidence</h4>
      <p className="preserve">{s.evidence}</p>
      {s.attachment && (
        <a
          className="text-button"
          href={s.attachment}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open supporting document / image <ExternalLink size={15} />
        </a>
      )}
      <p className="muted">
        {s.participants} reported participants · {s.hours} submitted total
        volunteer-hours
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void act({
            action: "review",
            submissionId: s.id,
            decision: f.get("decision"),
            feedback: f.get("feedback"),
            verifiedHours: hours,
            grantApproved: grant,
          });
        }}
      >
        <div className="two-col">
          <Field label="Verified total volunteer-hours">
            <input
              type="number"
              min="0"
              step="0.5"
              max={s.hours}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              required
            />
          </Field>
          <div className="score-preview">
            <span>Calculated demo score</span>
            <b>
              {score(c.points, hours, chapter.size)} <small>points</small>
            </b>
            <span>{c.points} base · capped effort · size factor</span>
          </div>
        </div>
        {c.grant > 0 && (
          <>
            <p className="small">{c.grantEligibility}</p>
            <label className="check-label">
              <input
                type="checkbox"
                checked={grant}
                onChange={(e) => setGrant(e.target.checked)}
              />{" "}
              Record {money(c.grant)} grant award. I verified eligibility and
              receipts. No payment will be processed.
            </label>
          </>
        )}
        <Field label="Decision">
          <select name="decision" defaultValue="" required>
            <option value="" disabled>
              Choose a review decision…
            </option>
            <option value="NEEDS_INFO">Request more information</option>
            <option value="REJECTED">Reject submission</option>
            <option value="APPROVED">Approve and award</option>
          </select>
        </Field>
        <Field label="Reviewer feedback">
          <textarea name="feedback" required maxLength={2000} />
        </Field>
        <label className="check-label">
          <input required type="checkbox" /> I reviewed the evidence against the
          completion criteria.
        </label>
        <button className="button" disabled={busy}>
          <ShieldCheck size={17} /> Confirm human review decision
        </button>
      </form>
    </article>
  );
}
