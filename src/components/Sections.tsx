import { useEffect, useState } from "react";
import { achievements, education, experience, profile, projects, summary, type Project } from "../data";
import Blueprint from "./Blueprint";
import HeroCar from "./HeroCar";
import MediaFigure from "./Media";
import { Finish } from "./Race";
import StartLights from "./StartLights";
import Terminal from "./Terminal";
import { Bullet, Reveal, Section, SectionHeader, Tag } from "./ui";

/* ---------------------------------------------------------------- Hero */

export function Hero() {
  return (
    <section id="top" className="relative pt-14 pb-[235px] sm:pb-[245px]">
      <div className="relative mx-auto grid w-full max-w-[1180px] grid-cols-1 items-center gap-6 px-4 py-8 sm:px-6 sm:py-10  lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-8 lg:px-8">
        <div className="pixel-box p-6 sm:p-8">
          <p className="flex items-center gap-2 font-pixel text-[10px] text-mint uppercase sm:text-xs">
            <span className="size-2 bg-mint blink" aria-hidden="true" />
            Open to SWE internships
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.75rem,7vw,5rem)] leading-[0.95] font-semibold">
            Mohammed
            <br />
            Hadi<span className="text-mint">.</span>
          </h1>
          <p className="mt-5 font-display text-xl leading-snug text-fg sm:text-2xl">{profile.oneLiner}</p>
          <p className="mt-3 font-mono text-sm text-fg-dim">
            {profile.role}
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <a href={profile.github} target="_blank" rel="noreferrer" className="pixel-button">
              GitHub
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="pixel-button">
              LinkedIn
            </a>
            <a href={`mailto:${profile.email}`} className="pixel-button">
              Email
            </a>
            <a href={profile.resume} target="_blank" rel="noreferrer" className="pixel-button text-amber">
              Résumé
            </a>
          </div>
        </div>
        <Terminal />
      </div>
      <HeroCar />
      {/* The start gantry hangs over the grid slot, just above the track */}
      <div className="absolute inset-x-0 bottom-[62px] sm:bottom-[104px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
          <StartLights />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- About */

export function About() {
  return (
    <Section id="about" tone="bg-bg/90">
      <SectionHeader index="01" title="About" />
      <div className="grid items-start gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        <Reveal>
          <p className="text-xl leading-relaxed sm:text-[1.4rem] sm:leading-relaxed">{summary}</p>
          <p className="mt-6 inline-flex items-center gap-2.5 font-display text-mint">
            <span className="size-2 bg-mint blink" aria-hidden="true" />
            Now: {profile.status}
          </p>
        </Reveal>
        <Reveal delay={80}>
          <div className="pixel-box p-5 sm:p-6">
            <p className="font-pixel text-[10px] text-fg-faint uppercase">Education</p>
            <h3 className="mt-2 font-display text-xl leading-snug font-semibold">{education.degree}</h3>
            <p className="mt-1 font-display text-amber">{education.school}</p>
            <p className="mt-2 font-mono text-sm text-fg-dim">
              {education.period} · {education.place}
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ---------------------------------------------------------------- Experience */

export function Experience() {
  return (
    <Section id="experience" tone="bg-ink/90">
      <SectionHeader index="02" title="Experience" />
      <ol className="space-y-5">
        {experience.map((x, i) => (
          <Reveal as="li" key={x.org} delay={i * 60} className="pixel-box grid gap-x-8 gap-y-3 p-5 sm:p-7 md:grid-cols-[13rem_1fr]">
            <div className="font-mono text-sm text-fg-dim">
              <p className="tabular-nums">{x.period}</p>
              <p>{x.place}</p>
              {x.current && (
                <p className="mt-2 inline-flex items-center gap-2 font-pixel text-[10px] text-mint uppercase">
                  <span className="size-1.5 bg-mint blink" aria-hidden="true" />
                  Current
                </p>
              )}
            </div>
            <div>
              <h3 className="font-display text-2xl leading-tight font-semibold">{x.role}</h3>
              <p className="mt-1 font-display text-lg text-amber">{x.org}</p>
              <ul className="mt-4 space-y-2 leading-relaxed text-fg-dim">
                {x.points.map((p) => (
                  <Bullet key={p}>{p}</Bullet>
                ))}
              </ul>
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                {x.tags.map((t) => (
                  <Tag key={t} tone="dim">
                    {t}
                  </Tag>
                ))}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}

/* ---------------------------------------------------------------- Projects */

type RepoMeta = { language: string | null; stars: number; pushed: string };

function useRepos() {
  const [repos, setRepos] = useState<Record<string, RepoMeta>>({});
  useEffect(() => {
    const key = "gh-repos-v1";
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        setRepos(JSON.parse(cached));
        return;
      }
    } catch {
      /* storage unavailable */
    }
    fetch(`https://api.github.com/users/${profile.githubUser}/repos?per_page=100`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { name: string; language: string | null; stargazers_count: number; pushed_at: string }[]) => {
        if (!Array.isArray(list)) return;
        const map: Record<string, RepoMeta> = {};
        for (const r of list) map[r.name.toLowerCase()] = { language: r.language, stars: r.stargazers_count, pushed: r.pushed_at };
        setRepos(map);
        try {
          sessionStorage.setItem(key, JSON.stringify(map));
        } catch {
          /* storage unavailable */
        }
      })
      .catch(() => {});
  }, []);
  return repos;
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function ago(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
  ];
  for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
  return "today";
}

const statusTone: Record<Project["status"], string> = {
  Deployed: "text-mint",
  Shipped: "text-peri",
  "In progress": "text-amber",
};

function ProjectCard({ p, meta }: { p: Project; meta?: RepoMeta }) {
  return (
    <article id={p.id} className="pixel-box grid scroll-mt-28 overflow-hidden md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <MediaFigure items={p.media} label={p.name} />
      <div className="flex flex-col gap-4 p-5 sm:p-7">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-display text-3xl leading-none font-semibold">{p.name}</h3>
          <span className={`inline-flex items-center gap-2 font-display ${statusTone[p.status]}`}>
            <span className={`size-2 bg-current ${p.status === "In progress" ? "blink" : ""}`} aria-hidden="true" />
            {p.status}
          </span>
        </header>
        <p className="-mt-1 font-display text-lg text-amber">{p.subtitle}</p>
        <p className="leading-relaxed">{p.summary}</p>
        <ul className="space-y-2 leading-relaxed text-fg-dim">
          {p.points.map((pt) => (
            <Bullet key={pt}>{pt}</Bullet>
          ))}
        </ul>
        {meta && (
          <p className="font-mono text-xs text-fg-faint">
            {meta.stars > 0 && <>★ {meta.stars} · </>}
            {meta.language ?? "—"} · last commit {ago(meta.pushed)}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            {p.stack.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </p>
          <p className="flex flex-wrap gap-2">
            {p.demo && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("term:run", { detail: p.demo!.command }))}
                className="pixel-button cursor-pointer text-mint"
              >
                ▶ {p.demo.label}
              </button>
            )}
            {p.repo && (
              <a href={`${profile.github}/${p.repo}`} target="_blank" rel="noreferrer" className="pixel-button" aria-label={`${p.name} on GitHub`}>
                Repo ↗
              </a>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}

export function Projects() {
  const repos = useRepos();

  return (
    <Section id="projects" tone="bg-bg/90">
      <SectionHeader index="03" title="Projects">
        Real code and images straight from my repos. Two of them run live in the terminal up top.
      </SectionHeader>
      <ul className="space-y-6">
        {projects.map((p, i) => (
          <Reveal as="li" key={p.id} delay={Math.min(i, 2) * 60}>
            <ProjectCard p={p} meta={p.repo ? repos[p.repo.toLowerCase()] : undefined} />
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}

/* ---------------------------------------------------------------- Stack */

export function Stack() {
  return (
    <Section id="stack" tone="bg-ink/90">
      <SectionHeader index="04" title="Stack">
        Every system on the car maps to part of how I build. Pick one to light it up.
      </SectionHeader>
      <Blueprint />
    </Section>
  );
}

/* ---------------------------------------------------------------- Achievements */

export function Achievements() {
  return (
    <Section id="achievements" tone="bg-bg/90">
      <SectionHeader index="05" title="Achievements" />
      <ol className="grid gap-4 md:grid-cols-2">
        {achievements.map((a, i) => (
          <Reveal as="li" key={a.title} delay={i * 60} className={`pixel-box flex gap-4 p-5 sm:p-6 ${a.highlight ? "pixel-box-amber" : ""}`}>
            <span aria-hidden="true" className="pixel-notch mt-0.5 grid size-10 shrink-0 place-items-center bg-amber/15 font-pixel text-sm text-amber">
              {a.kind === "Award" ? "★" : "✓"}
            </span>
            <div>
              <p className="font-pixel text-[10px] text-fg-faint uppercase">{a.kind}</p>
              <h3 className="mt-1 font-display text-xl leading-snug font-semibold">{a.title}</h3>
              <p className="mt-1 text-fg-dim">{a.by}</p>
            </div>
          </Reveal>
        ))}
      </ol>

    </Section>
  );
}

/* ---------------------------------------------------------------- Contact */

export function Contact() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <section id="contact" className="relative bg-ink/90 pt-24 sm:pt-28">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <SectionHeader index="06" title="Let's talk." />
        <Reveal>
          <p className="max-w-2xl text-xl leading-relaxed sm:text-2xl">
            I&apos;m looking for software engineering internships. If you&apos;re building trading systems, backend infrastructure or applied ML,
            I&apos;d love to hear from you.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href={`mailto:${profile.email}`} className="pixel-button !bg-mint text-lg !text-ink">
              ✉ {profile.email}
            </a>
            <button type="button" onClick={copy} className="pixel-button cursor-pointer text-peri">
              {copied ? "Copied ✓" : "Copy email"}
            </button>
            <a href={profile.github} target="_blank" rel="noreferrer" className="pixel-button">
              GitHub ↗
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" className="pixel-button">
              LinkedIn ↗
            </a>
          </div>
        </Reveal>
      </div>
      <Finish />
      <footer className="border-t-2 border-line">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-2 px-4 py-6 font-mono text-xs text-fg-faint sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {profile.name} · {profile.location}
          </p>
          <p>
            Built from scratch ·{" "}
            <a href={`${profile.github}/portfolio`} target="_blank" rel="noreferrer" className="text-peri hover:underline">
              source ↗
            </a>{" "}
            · type <span className="text-mint">help</span> in the terminal
          </p>
        </div>
      </footer>
    </section>
  );
}
