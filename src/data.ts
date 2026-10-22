export const profile = {
  name: "Mohammed Hadi",
  oneLiner: "Backend systems, quant models, markets & crypto.",
  role: "Data Science & Engineering @ MIT Manipal",
  intro: "I build backend and distributed systems, trading research tools and the AI tooling in between, and ship them to the cloud with Docker and Kubernetes.",
  location: "Manipal, India",
  email: "mhdhadiabdullah@gmail.com",
  github: "https://github.com/mhdhadi2005",
  githubUser: "mhdhadi2005",
  linkedin: "https://www.linkedin.com/in/mohammed-hadi-b10421287/",
  resume: "/Mohammed_Hadi_Resume.pdf",
  status: "Web Dev Intern @ Montagu Publishing",
};

export const summary =
  "I design, build, test and debug software in Python, Java, C/C++ and JavaScript, and I like working close to the metal of a system: wire protocols, replication, schemas. I ship to Azure, AWS and GCP with Docker and Kubernetes, and iterate on designs from real stakeholder feedback. Outside of that I'm deep in markets: quant research, trading competitions and crypto.";

export type Experience = {
  role: string;
  org: string;
  period: string;
  place: string;
  current: boolean;
  points: string[];
  tags: string[];
};

export const experience: Experience[] = [
  {
    role: "Web Development Intern",
    org: "Montagu Publishing",
    period: "Jan 2026 – Present",
    place: "Remote",
    current: true,
    points: [
      "Build and iterate landing pages across the company's newsletter brands (including Devoted Grandma) with WordPress, Astra, Elementor and Beehiiv, shipping distinct page themes and syncing lead-capture forms to Beehiiv's Enterprise account.",
      "Diagnosed a recurring full-bleed layout bug where the standard 100vw / -50vw breakout failed inside Astra/Elementor's nested containers, and replaced it with a container-relative fix now reused across pages.",
      "Built and maintain a single-variable A/B testing library for lead-magnet pages (exit-intent popups, sticky CTAs, social proof), designing each test from direct stakeholder feedback.",
      "Structure layouts and iterate copy and design against funnel and performance goals for a niche US audience.",
    ],
    tags: ["WordPress", "Elementor", "Beehiiv", "A/B testing", "CSS"],
  },
  {
    role: "Regional Head, Business Development",
    org: "AIESEC",
    period: "Jan 2025 – Dec 2025",
    place: "Manipal, India",
    current: false,
    points: [
      "Orchestrated B2B collaborations and sponsorship deals, using negotiation and data-driven insight to hit national and regional growth targets.",
      "Led a Business Development team, building a high-performance culture through coaching, delegation and alignment with organisational goals.",
      "Directed national and international BD campaigns end to end, mentoring cross-functional teams and coordinating with external stakeholders.",
    ],
    tags: ["Leadership", "Partnerships", "Negotiation"],
  },
];

export const education = {
  degree: "B.Tech, Data Science and Engineering",
  school: "Manipal Institute of Technology (MIT Manipal)",
  period: "Jul 2023 – Present",
  place: "Manipal, India",
};

export type Media =
  | { kind: "img"; src: string; alt: string; caption: string; fit?: "cover" | "contain"; pos?: string; light?: boolean }
  | { kind: "code"; file: string; lang: "java" | "python" | "c" | "sql" | "ts"; code: string }
  | { kind: "art"; name: string; caption: string };

export type Project = {
  id: string;
  name: string;
  subtitle: string;
  status: "Shipped" | "Deployed" | "In progress";
  repo?: string;
  summary: string;
  points: string[];
  stack: string[];
  media: Media[];
  /** Command to run in the hero terminal, for projects with a live demo. */
  demo?: { label: string; command: string };
};

export const projects: Project[] = [
  {
    id: "portfolio",
    name: "This portfolio",
    subtitle: "Hand-built, no templates",
    status: "Shipped",
    repo: "portfolio",
    summary:
      "The site you're on: a canvas pixel scene, a vector F1 car whose lit engineering is driven by CSS data attributes, and a terminal that runs a mini Redis and a live backtester in your browser.",
    points: [
      "React 19, TypeScript, Vite and Tailwind v4. No UI kit, no animation library.",
      "A serverless start-lights leaderboard on a Redis sorted set, validated, rate-limited and moderated.",
      "Three modes re-frame the whole site, Vercel Analytics and JSON-LD for search, and every push auto-deploys.",
    ],
    stack: ["React", "TypeScript", "Tailwind", "Canvas", "Vercel"],
    media: [
      { kind: "img", src: "/og.png", alt: "The portfolio hero: a pixel night scene with the terminal and the #44 on the grid.", caption: "The hero, live", pos: "50% 30%" },
      {
        kind: "code",
        file: "api/reaction.ts",
        lang: "ts",
        code: `const key = name.toLowerCase();
const prev = await redis.zscore(BOARD, key);
const improved = prev === null || ms < Number(prev);
if (improved) {
  await redis.zadd(BOARD, { score: ms, member: key });
  await redis.hset(NAMES, { [key]: name });
  // Keep the board bounded: drop everyone below the top MAX_ENTRIES
  await redis.zremrangebyrank(BOARD, MAX_ENTRIES, -1);
}
const [rank, total] = await Promise.all([redis.zrank(BOARD, key), redis.zcard(BOARD)]);`,
      },
    ],
  },
  {
    id: "quantai",
    name: "QuantAI",
    subtitle: "Quantitative trading research system",
    status: "Deployed",
    repo: "QuantAI",
    summary:
      "An AI-assisted trading research system over historical OHLCV data, built to answer one question honestly: does the model actually have an edge?",
    points: [
      "Benchmarks XGBoost and Random Forest classifiers against LSTM time-series models on engineered technical-indicator features.",
      "Time-aware train/test splits and a backtesting framework that prevents lookahead bias.",
      "Inference served behind FastAPI for real-time, low-latency predictions.",
    ],
    stack: ["Python", "Pandas", "XGBoost", "LSTM", "FastAPI"],
    demo: { label: "Run a backtest", command: "backtest 10 30" },
    media: [
      {
        kind: "code",
        file: "backend/app/backtester/engine.py",
        lang: "python",
        code: `# Max Drawdown
peak = np.maximum.accumulate(eq)
drawdown = (eq - peak) / np.where(peak > 0, peak, 1)
self.max_drawdown = float(np.min(drawdown)) if len(drawdown) > 0 else 0.0

# Trade stats
completed_trades = [t for t in self.trades if t.get("pnl") is not None]
winning_trades = [t for t in completed_trades if t.get("pnl", 0) > 0]
losing_trades = [t for t in completed_trades if t.get("pnl", 0) <= 0]

self.total_trades = len(completed_trades)
self.winning_trades = len(winning_trades)
self.losing_trades = len(losing_trades)
self.win_rate = self.winning_trades / max(self.total_trades, 1)

gross_profit = sum(t.get("pnl", 0) for t in winning_trades)
gross_loss = abs(sum(t.get("pnl", 0) for t in losing_trades))
self.profit_factor = gross_profit / max(gross_loss, 0.01)`,
      },
      { kind: "art", name: "candles", caption: "Classifiers vs LSTM on technical-indicator features" },
    ],
  },
  {
    id: "redis-java",
    name: "redis-java",
    subtitle: "A Redis server, from scratch, in Java",
    status: "Deployed",
    repo: "redis-java",
    summary:
      "A Redis-compatible server written from the socket up: a custom RESP parser/serializer and a multi-client TCP server that speaks the real Redis wire protocol.",
    points: [
      "Handles PING, ECHO, SET (with PX expiry), GET, INCR, DEL and INFO across many simultaneous clients.",
      "Debugged concurrency edge cases so command handling stays correct under parallel load.",
      "Master/replica replication for data reliability.",
      "Containerised with Docker and shipped with a documented Kubernetes Helm chart.",
    ],
    stack: ["Java", "Spring", "TCP", "Docker", "Helm"],
    demo: { label: "Try it in the terminal", command: "SET hello world" },
    media: [
      {
        kind: "code",
        file: "Components/Service/RespSerializer.java",
        lang: "java",
        code: `public String serializeBulkString(String s){
    int length = s.length();
    String respHeader = "$"+length;
    String respBody = s;
    return respHeader + "\\r\\n" + respBody + "\\r\\n";
}

public int getParts(char []dataArr, int i, String[] subArray){
    int j=0;
    while(i< dataArr.length && j < subArray.length){
        if(dataArr[i] == '$'){
            //bulk String
            //$<length>\\r\\n<data>\\r\\n
            i++;
            String partLength = "";
            while(i < dataArr.length && Character.isDigit(dataArr[i])){
                partLength += dataArr[i];
                i++;
            }`,
      },
      { kind: "art", name: "server", caption: "Master/replica, containerised with a Helm chart" },
    ],
  },
  {
    id: "slotlock",
    name: "Slotlock",
    subtitle: "Booking pages with deposits",
    status: "In progress",
    repo: "Slotlock",
    summary:
      "Booking pages for tattoo artists, barbers and anyone burned by no-shows. Clients pay the deposit directly, the artist confirms, and unpaid holds release their slot on their own.",
    points: [
      "Artists add services, hours and how they get paid, then put one link in their Instagram bio.",
      "Never touches client money: no payment processor needed.",
    ],
    stack: ["JavaScript", "Node"],
    media: [
      { kind: "img", src: "/media/slot-1.webp", alt: "Slotlock launch carousel: Your DMs aren't a booking system.", caption: "Launch carousel, 1 of 3", pos: "50% 45%" },
      { kind: "img", src: "/media/slot-3.webp", alt: "Slotlock carousel showing an artist's booking page on a phone with open time slots.", caption: "The booking page", pos: "50% 40%" },
      { kind: "img", src: "/media/slot-2.webp", alt: "Slotlock launch carousel, second slide.", caption: "Launch carousel, 2 of 3", pos: "50% 45%" },
    ],
  },
  {
    id: "cookbook",
    name: "ai-cookbook",
    subtitle: "AI engineering reference library",
    status: "Shipped",
    repo: "AI-COOKBOOK",
    summary:
      "A copy/paste-ready library of AI system patterns: agent design, agentic and hybrid RAG pipelines, and structured-output workflows.",
    points: [
      "A full Model Context Protocol crash course covering server implementation and client integration.",
      "OpenAI API examples for structured outputs, Assistants and Whisper.",
    ],
    stack: ["Python", "LLM APIs", "MCP", "RAG"],
    media: [
      { kind: "img", src: "/media/cook-rrf.webp", alt: "Diagram: how Reciprocal Rank Fusion combines BM25 and dense rankings.", caption: "Hybrid retrieval: Reciprocal Rank Fusion", fit: "contain", light: true },
      { kind: "img", src: "/media/cook-bm25.webp", alt: "Diagram: how BM25 ranks documents.", caption: "Hybrid retrieval: how BM25 ranks", fit: "contain", light: true },
    ],
  },
  {
    id: "garden",
    name: "My Daily Garden",
    subtitle: "Newsletter gamification system",
    status: "In progress",
    repo: "My-daily-garden",
    summary:
      "A streak-and-points engine that grows an almond tree as readers engage with a newsletter, wired into Beehiiv and WooCommerce.",
    points: [
      "Gathered requirements from a non-technical stakeholder and iterated the design before building.",
      "Next.js + Beehiiv merge-tag integration, with the data flow between newsletter, points engine and WooCommerce documented.",
    ],
    stack: ["Next.js", "Node", "Beehiiv API", "WooCommerce", "SQL"],
    media: [
      {
        kind: "code",
        file: "src/db/schema.sql",
        lang: "sql",
        code: `CREATE TABLE IF NOT EXISTS subscribers (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  beehiiv_subscriber_id TEXT UNIQUE NOT NULL,
  email               TEXT NOT NULL,
  wp_user_id          INTEGER,
  points              INTEGER NOT NULL DEFAULT 0,
  streak              INTEGER NOT NULL DEFAULT 0,
  longest_streak      INTEGER NOT NULL DEFAULT 0,
  last_engaged_date   TEXT,
  total_harvests      INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS click_log (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id  INTEGER NOT NULL REFERENCES subscribers(id),
  counted        INTEGER NOT NULL DEFAULT 1,
  clicked_at     TEXT NOT NULL DEFAULT (datetime('now'))
);`,
      },
      { kind: "art", name: "tree", caption: "Streaks and points grow the tree" },
    ],
  },
  {
    id: "minic",
    name: "minic",
    subtitle: "A small C compiler, written in C",
    status: "Shipped",
    repo: "c-compiler",
    summary:
      "Compiles a subset of C straight to x86-64 GNU assembly that links against libc, so programs can call real functions like printf.",
    points: ["Pointers, arrays, short-circuit logic, if/while/for and functions with up to 6 params via the System V ABI."],
    stack: ["C", "x86-64", "System V ABI"],
    media: [
      {
        kind: "code",
        file: "minic.c · gen_expr",
        lang: "c",
        code: `// binary arithmetic / comparison ops
gen_expr(node->lhs);
gen_expr(node->rhs);
printf("  pop %%rdi\\n");
printf("  pop %%rax\\n");

switch (node->kind) {
case ND_ADD: printf("  add %%rdi, %%rax\\n"); break;
case ND_SUB: printf("  sub %%rdi, %%rax\\n"); break;
case ND_MUL: printf("  imul %%rdi, %%rax\\n"); break;
case ND_DIV:
    printf("  cqo\\n");
    printf("  idiv %%rdi\\n");
    break;
case ND_EQ: printf("  cmp %%rdi, %%rax\\n"); printf("  sete %%al\\n"); printf("  movzb %%al, %%rax\\n"); break;
}
printf("  push %%rax\\n");`,
      },
      {
        kind: "code",
        file: "examples/fib.c",
        lang: "c",
        code: `int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}

int main() {
    int i;
    for (i = 0; i < 10; i = i + 1) {
        printf("%d ", fib(i));
    }
    printf("\\n");
    return 0;
}`,
      },
    ],
  },
  {
    id: "localgpt",
    name: "LocalGPT",
    subtitle: "Production API layer for local models",
    status: "In progress",
    repo: "localgpt",
    summary:
      "An open-source API, modelled on the Claude API, that turns any OpenAI-compatible local inference server (Ollama, llama.cpp, vLLM) into the building blocks for private AI apps.",
    points: [
      "Doesn't run models itself: it points at any server exposing /v1/chat/completions and /v1/models.",
      "Ships a built-in workbench UI for testing and demos.",
    ],
    stack: ["Python", "OpenAI-compatible APIs", "Ollama"],
    media: [{ kind: "art", name: "chip", caption: "Your app → LocalGPT API → any local inference server" }],
  },
];


export const achievements = [
  { kind: "Award", title: "5th nationally, Big Bull Trading Competition", by: "Master's Union × CaseUnion", highlight: true },
  { kind: "Award", title: "Top 3, Sharjah Chamber Award for Innovators", by: "Sharjah Chamber of Commerce", highlight: false },
  { kind: "Certification", title: "Microsoft Azure for Data Engineering", by: "Microsoft", highlight: false },
  { kind: "Certification", title: "Python for Data Science, AI & Development", by: "IBM", highlight: false },
];

export const sections = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "stack", label: "Stack" },
  { id: "achievements", label: "Achievements" },
  { id: "contact", label: "Contact" },
] as const;
