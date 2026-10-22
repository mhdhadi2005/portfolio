import { useSyncExternalStore } from "react";

/**
 * Three ways to read the same person. Every mode re-frames real résumé content:
 * which story leads, which projects show, how the stack blueprint maps, and the
 * site's accent + sky glow. Shareable as ?mode=web / ?mode=bd.
 */

export type Mode = "eng" | "web" | "bd";
export type Zone = "cockpit" | "power" | "ers" | "telemetry";
export type SkillGroup = { group: string; zone: Zone; part: string; why: string; items: string[] };

type ModeConfig = {
  label: string;
  short: string;
  glyph: string;
  title: string;
  accent: string;
  /** Horizon glow for the night sky, RGB */
  glow: [number, number, number];
  tag: string;
  oneLiner: string;
  role: string;
  summary: string;
  /** Experience entries by org, most relevant first; the first is highlighted */
  experience: string[];
  /** Project ids in display order; anything missing is hidden behind "show all" */
  projects: string[];
  angles: Record<string, string>;
  projectsBlurb: string;
  stackTitle: string;
  stackBlurb: string;
  skills: SkillGroup[];
  contact: string;
};

export const MODES: Record<Mode, ModeConfig> = {
  eng: {
    label: "Engineer",
    short: "ENG",
    glyph: "⚙",
    title: "Mohammed Hadi: Software Engineer",
    accent: "#7fe0c3",
    glow: [150, 78, 104],
    tag: "Engineering profile",
    oneLiner: "Backend systems, quant models, markets & crypto.",
    role: "Data Science & Engineering @ MIT Manipal",
    summary:
      "I design, build, test and debug software in Python, Java, C/C++ and JavaScript, and I like working close to the metal of a system: wire protocols, replication, schemas. I ship to Azure, AWS and GCP with Docker and Kubernetes, and iterate on designs from real stakeholder feedback. Outside of that I'm deep in markets: quant research, trading competitions and crypto.",
    experience: ["Montagu Publishing", "AIESEC"],
    projects: ["quantai", "redis-java", "portfolio", "slotlock", "cookbook", "garden", "minic", "localgpt"],
    angles: {},
    projectsBlurb: "Real code and images straight from my repos. Two of them run live in the terminal up top.",
    stackTitle: "Stack",
    stackBlurb: "Every system on the car maps to part of how I build. Pick one to light it up.",
    skills: [
      {
        group: "Languages",
        zone: "cockpit",
        part: "Cockpit",
        why: "The controls. Everything else is driven from here.",
        items: ["Python", "Java", "C", "C++", "JavaScript", "TypeScript", "SQL"],
      },
      {
        group: "Backend & systems",
        zone: "power",
        part: "Power unit",
        why: "The engine: servers, protocols and data stores that do the real work.",
        items: ["FastAPI", "Spring", "Node.js", "Flask", "RESP / TCP", "MongoDB", "MySQL", "Redis"],
      },
      {
        group: "Data, ML & quant",
        zone: "telemetry",
        part: "Tyres & telemetry",
        why: "Strategy comes from data: models, backtests and the sensors feeding them.",
        items: ["Pandas", "NumPy", "Scikit-learn", "XGBoost", "LSTM", "Backtesting", "RAG", "MCP"],
      },
      {
        group: "Infra & cloud",
        zone: "ers",
        part: "ERS + DRS",
        why: "Deploy power exactly when it's needed: containers, clusters and CI.",
        items: ["Docker", "Kubernetes (Helm)", "GitHub Actions", "Azure", "Google Cloud", "AWS"],
      },
    ],
    contact:
      "I'm looking for software engineering internships. If you're building trading systems, backend infrastructure or applied ML, I'd love to hear from you.",
  },

  web: {
    label: "Web Dev",
    short: "WEB",
    glyph: "</>",
    title: "Mohammed Hadi: Web Developer",
    accent: "#6fd3ff",
    glow: [56, 112, 150],
    tag: "Web dev profile",
    oneLiner: "Landing pages that convert, layouts that never break.",
    role: "Web Development Intern @ Montagu Publishing",
    summary:
      "I build and iterate landing pages across Montagu Publishing's newsletter brands with WordPress, Elementor and Beehiiv, and I care about the details that make them convert: layouts that hold up inside nested containers, lead forms that sync cleanly, and single-variable A/B tests designed from real stakeholder feedback. Outside work I ship full-stack projects with Next.js and Node, and this site is hand-built with React, TypeScript and canvas.",
    experience: ["Montagu Publishing", "AIESEC"],
    projects: ["portfolio", "slotlock", "garden", "quantai", "redis-java"],
    angles: {
      portfolio: "Frontend craft: canvas, SVG and CSS-driven animation, no templates",
      slotlock: "A booking product with its own Instagram launch campaign",
      garden: "Next.js + Beehiiv merge-tag integration wired to WooCommerce",
      quantai: "A FastAPI service with its own web front end",
      "redis-java": "The cache layer behind the web, built from the socket up",
    },
    projectsBlurb: "Things I've shipped for the web, starting with the page you're on.",
    stackTitle: "Web stack",
    stackBlurb: "Same car, different crew: every system maps to how I build for the web.",
    skills: [
      {
        group: "Frontend",
        zone: "cockpit",
        part: "Cockpit",
        why: "What the visitor actually touches: fast, accessible, a little bit fun.",
        items: ["React", "TypeScript", "JavaScript", "Next.js", "Tailwind CSS", "HTML & CSS", "Canvas & SVG"],
      },
      {
        group: "CMS & integrations",
        zone: "power",
        part: "Power unit",
        why: "The engine behind the pages: content, forms and the services they sync with.",
        items: ["WordPress", "Elementor", "Astra", "Beehiiv", "WooCommerce", "Node.js", "REST APIs"],
      },
      {
        group: "Testing & growth",
        zone: "telemetry",
        part: "Tyres & telemetry",
        why: "Decisions from data: single-variable tests and funnel metrics.",
        items: ["A/B testing", "Funnels", "Lead capture", "Web analytics", "SEO"],
      },
      {
        group: "Ship & deploy",
        zone: "ers",
        part: "ERS + DRS",
        why: "Deploy on demand: previews, CI and serverless backends.",
        items: ["Vercel", "GitHub Actions", "Docker", "Serverless functions", "Redis"],
      },
    ],
    contact:
      "I'm looking for web development and frontend work. If you need landing pages that convert or a front end people remember, let's talk.",
  },

  bd: {
    label: "BD",
    short: "BD",
    glyph: "↗",
    title: "Mohammed Hadi: Business Development",
    accent: "#ffa07a",
    glow: [176, 96, 58],
    tag: "Business development profile",
    oneLiner: "Partnerships, sponsorships and teams that hit their targets.",
    role: "Former Regional Head of Business Development @ AIESEC",
    summary:
      "As Regional Head of Business Development at AIESEC I led a BD team through national and international campaigns, closed B2B collaborations and sponsorship deals, and used data-driven insight to hit regional growth targets. I coach and delegate, coordinate with external stakeholders, and bring an engineer's eye to every deal: I understand the product as well as the pitch.",
    experience: ["AIESEC", "Montagu Publishing"],
    projects: ["slotlock", "garden", "quantai"],
    angles: {
      slotlock: "Product + go-to-market: a booking product with its own Instagram launch",
      garden: "Requirements gathered from a non-technical stakeholder, then built",
      quantai: "Market sense: 5th nationally at Big Bull, now tested with models",
    },
    projectsBlurb: "Products where the business side mattered as much as the build.",
    stackTitle: "Toolkit",
    stackBlurb: "Every system on the car maps to how I run partnerships. Pick one to light it up.",
    skills: [
      {
        group: "Leadership",
        zone: "cockpit",
        part: "Cockpit",
        why: "Steering the team: coaching and delegating so everyone drives at full pace.",
        items: ["Team leadership", "Coaching", "Delegation", "Mentoring", "Strategic alignment"],
      },
      {
        group: "Partnerships",
        zone: "power",
        part: "Power unit",
        why: "The engine of growth: deals that work for both sides.",
        items: ["B2B collaborations", "Sponsorship deals", "Negotiation", "Stakeholder management"],
      },
      {
        group: "Data-driven growth",
        zone: "telemetry",
        part: "Tyres & telemetry",
        why: "Strategy from numbers: insight first, then targets.",
        items: ["Growth targets", "Data-driven insights", "Markets & trading", "Analytics"],
      },
      {
        group: "Campaigns",
        zone: "ers",
        part: "ERS + DRS",
        why: "Deploying energy where it counts, end to end.",
        items: ["National campaigns", "International campaigns", "Cross-functional teams", "Execution"],
      },
    ],
    contact:
      "If you're building partnerships or growing a product and want someone who understands both the deal and the tech, I'd love to talk.",
  },
};

export const MODE_ORDER: Mode[] = ["eng", "web", "bd"];

const fromUrl = (): Mode => {
  const m = new URLSearchParams(window.location.search).get("mode");
  return m === "web" || m === "bd" ? m : "eng";
};

let mode: Mode = typeof window === "undefined" ? "eng" : fromUrl();
const listeners = new Set<() => void>();

function apply() {
  const root = document.documentElement;
  root.dataset.mode = mode;
  root.style.setProperty("--color-mint", MODES[mode].accent);
  document.title = MODES[mode].title;
}
if (typeof window !== "undefined") apply();

/** Switch immediately (the transition component calls this at the midpoint of its wipe). */
export function commitMode(next: Mode) {
  if (next === mode) return;
  mode = next;
  // Only animate content after a real switch, so first paint never depends on an animation running
  document.documentElement.dataset.modeSwitched = "1";
  apply();
  const url = new URL(window.location.href);
  if (next === "eng") url.searchParams.delete("mode");
  else url.searchParams.set("mode", next);
  window.history.replaceState(null, "", url);
  listeners.forEach((l) => l());
}

/** Ask for a mode change; plays the pixel wipe if one is mounted, otherwise switches at once. */
export function setMode(next: Mode) {
  if (next === mode) return;
  const handled = !window.dispatchEvent(new CustomEvent("mode:request", { detail: next, cancelable: true }));
  if (!handled) commitMode(next);
}

export const getMode = () => mode;

export function useMode() {
  const m = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => mode,
    () => mode,
  );
  return { mode: m, cfg: MODES[m] };
}
