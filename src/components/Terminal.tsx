import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { profile, projects, sections, skills } from "../data";
import { smaCrossover } from "../lib/backtest";
import { btcStore, loadBtc, usd } from "../lib/btc";
import { encodeCommand, encodeReply, formatReply, MiniRedis, REDIS_COMMANDS, splitArgs } from "../lib/redis";

type Kind = "in" | "out" | "dim" | "err" | "ok" | "amber";
type Line = { id: number; kind: Kind; text?: string; node?: ReactNode };

const PROMPT = "hadi@manipal:~$";

const COINS: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  bnb: "binancecoin",
  xrp: "ripple",
  doge: "dogecoin",
  ada: "cardano",
  avax: "avalanche-2",
  link: "chainlink",
};

const SUGGESTIONS = ["whoami", "SET coin btc", "backtest 10 30", "lights", "help"];

const pct = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(2)}%`;

const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

/** Tiny pixel equity chart for the backtest output. */
function EquityChart({ a, b }: { a: number[]; b: number[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const W = 160;
    const H = 40;
    cv.width = W;
    cv.height = H;
    const g = cv.getContext("2d")!;
    const all = [...a, ...b];
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const y = (v: number) => Math.round(H - 2 - ((v - lo) / Math.max(1e-9, hi - lo)) * (H - 4));
    const x = (i: number, n: number) => Math.round((i / Math.max(1, n - 1)) * (W - 1));
    g.fillStyle = "#2a2e57";
    for (let i = 0; i < W; i += 2) g.fillRect(i, y(1), 1, 1);
    const draw = (arr: number[], col: string) => {
      g.fillStyle = col;
      let py = y(arr[0]);
      arr.forEach((v, i) => {
        const yy = y(v);
        const xx = x(i, arr.length);
        g.fillRect(xx, Math.min(py, yy), 1, Math.abs(yy - py) + 1);
        py = yy;
      });
    };
    draw(b, "#6d71a0");
    draw(a, "#7fe0c3");
  }, [a, b]);
  return (
    <div className="my-1">
      <canvas ref={ref} className="pixelated h-20 w-full max-w-md border-2 border-line bg-bg" aria-label="Equity curve: strategy vs buy and hold" />
      <p className="mt-1 text-[11px] text-fg-faint">
        <span className="text-mint">■</span> strategy <span className="ml-3 text-fg-faint">■</span> buy &amp; hold
      </p>
    </div>
  );
}

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);
  const redis = useRef(new MiniRedis());
  const resp = useRef(true);
  const history = useRef<string[]>([]);
  const hIdx = useRef(-1);
  const nextId = useRef(1);
  const outRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const print = useCallback((text: string, kind: Kind = "out") => {
    setLines((l) => [...l, { id: nextId.current++, kind, text }]);
  }, []);
  const printNode = useCallback((node: ReactNode) => {
    setLines((l) => [...l, { id: nextId.current++, kind: "out", node }]);
  }, []);

  const greeted = useRef(false);
  useEffect(() => {
    loadBtc();
    if (greeted.current) return;
    greeted.current = true;
    print("hadi-sh · a real shell in your browser: mini Redis, live BTC backtester and more", "amber");
    print("Type help, or tap a command below.", "dim");
  }, [print]);

  useEffect(() => {
    const el = outRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const runRedis = (argv: string[]) => {
    const reply = redis.current.exec(argv);
    print(formatReply(reply), reply.t === "err" ? "err" : "out");
    if (resp.current) {
      const trim = (s: string) => (s.length > 86 ? s.slice(0, 85) + "…" : s);
      print(`  → ${trim(encodeCommand(argv))}`, "dim");
      print(`  ← ${trim(encodeReply(reply))}`, "dim");
    }
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const run = async (raw: string) => {
    const line = raw.trim();
    print(`${PROMPT} ${line}`, "in");
    if (!line) return;
    history.current = [line, ...history.current.filter((h) => h !== line)].slice(0, 50);
    hIdx.current = -1;

    let argv = splitArgs(line);
    let cmd = argv[0].toLowerCase();
    if ((cmd === "redis" || cmd === "redis-cli") && argv.length > 1) {
      argv = argv.slice(1);
      cmd = argv[0].toLowerCase();
    }
    if (REDIS_COMMANDS.includes(cmd.toUpperCase())) return runRedis(argv);

    const args = argv.slice(1);
    switch (cmd) {
      case "help":
        print("shell", "amber");
        print("  whoami · about · projects · open <project> · stack · contact · resume");
        print("  ls · cd <section> · neofetch · history · clear");
        print("markets", "amber");
        print("  price [btc|eth|sol|…]     live price from CoinGecko");
        print("  backtest [fast] [slow]    SMA crossover on real BTC 4h candles");
        print("redis (in-browser, same commands as redis-java)", "amber");
        print("  SET k v [PX ms] · GET · INCR · DEL · EXISTS · KEYS * · TTL · EXPIRE · INFO · PING");
        print("  resp on|off               show the raw RESP bytes on the wire");
        print("pit wall", "amber");
        print("  lights                    F1 start-lights reaction test");
        print("  box                       box box: pit for the résumé");
        print("github", "amber");
        print("  git log                   my latest real commits");
        return;
      case "whoami":
        print(profile.name, "ok");
        print(`${profile.role} · ${profile.location}`);
        print(profile.oneLiner, "dim");
        return;
      case "about":
        print(profile.intro);
        print(`Currently: ${profile.status}`, "dim");
        return;
      case "projects":
        for (const p of projects) print(`  ${p.name.padEnd(16)} ${p.subtitle}`);
        print("open <name> for the repo · cd projects to scroll there", "dim");
        return;
      case "open": {
        const q = args.join(" ").toLowerCase();
        const p = projects.find((x) => [x.id, x.name.toLowerCase(), x.repo?.toLowerCase()].some((n) => n && q && n.includes(q)));
        if (!p?.repo) return print(q ? `open: no project matching "${q}"` : "usage: open <project>", "err");
        print(`opening ${profile.github}/${p.repo}`, "dim");
        window.open(`${profile.github}/${p.repo}`, "_blank", "noopener");
        return;
      }
      case "stack":
        for (const s of skills) print(`  ${s.group.padEnd(18)} ${s.items.join(", ")}`);
        return;
      case "contact":
        print(`  email     ${profile.email}`);
        print(`  github    ${profile.github}`);
        print(`  linkedin  ${profile.linkedin}`);
        return;
      case "resume":
      case "cv":
        print("opening résumé (PDF)…", "dim");
        window.open(profile.resume, "_blank", "noopener");
        return;
      case "ls":
        print(sections.map((s) => s.id + "/").join("  "));
        return;
      case "cd": {
        const target = (args[0] ?? "").replace(/\/$/, "").toLowerCase();
        if (!target || target === "~") return scrollTo("top");
        if (!sections.some((s) => s.id === target)) return print(`cd: no such section: ${target}`, "err");
        scrollTo(target);
        return;
      }
      case "clear":
        setLines([]);
        return;
      case "history":
        [...history.current].reverse().forEach((h, i) => print(`  ${String(i + 1).padStart(3)}  ${h}`));
        return;
      case "resp":
        if (args[0] === "on" || args[0] === "off") resp.current = args[0] === "on";
        print(`RESP view ${resp.current ? "on" : "off"}`, "dim");
        return;
      case "neofetch":
        printNode(
          <div className="flex gap-5">
            <pre className="leading-tight text-amber" aria-hidden="true">{`█▄ ▄█ █  █\n█ ▀ █ █▀▀█\n▀   ▀ ▀  ▀`}</pre>
            <div>
              <p className="text-mint">hadi@manipal</p>
              <p>
                <span className="text-peri">degree</span> B.Tech Data Science &amp; Engineering, MIT
              </p>
              <p>
                <span className="text-peri">now</span> {profile.status}
              </p>
              <p>
                <span className="text-peri">langs</span> {skills[0].items.join(" · ")}
              </p>
              <p>
                <span className="text-peri">likes</span> markets · crypto · distributed systems
              </p>
            </div>
          </div>,
        );
        return;
      case "price": {
        const sym = (args[0] ?? "btc").toLowerCase();
        const id = COINS[sym];
        if (!id) return print(`price: try one of ${Object.keys(COINS).join(", ")}`, "err");
        setBusy(true);
        try {
          const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`);
          const d = await r.json();
          const p = d[id]?.usd;
          if (typeof p !== "number") throw new Error();
          const ch = (d[id].usd_24h_change ?? 0) / 100;
          print(`${sym.toUpperCase()}/USD  ${usd(p, p < 10 ? 4 : 2)}  ${ch >= 0 ? "▲" : "▼"} ${pct(ch)} 24h`, ch >= 0 ? "ok" : "err");
          print("source: CoinGecko", "dim");
        } catch {
          print("price: couldn't reach CoinGecko right now (rate-limited?)", "err");
        } finally {
          setBusy(false);
        }
        return;
      }
      case "backtest": {
        const fast = Math.max(2, Math.min(60, parseInt(args[0] ?? "10") || 10));
        const slow = Math.max(fast + 1, Math.min(120, parseInt(args[1] ?? "30") || 30));
        const { bars, source } = btcStore.get();
        const bt = smaCrossover(bars, fast, slow);
        print(`BTC/USD · 4h · ${bars.length} bars · ${source === "live" ? "live CoinGecko data" : "offline sample data"}`, "dim");
        print(`SMA(${fast}) × SMA(${slow}) · long/flat · 0.10% fee · signal on close t, fills on t+1`, "dim");
        print(`  strategy   ${pct(bt.ret).padStart(9)}    buy & hold ${pct(bt.buyHold).padStart(9)}`, bt.ret >= bt.buyHold ? "ok" : "out");
        print(`  max DD     ${pct(bt.maxDrawdown).padStart(9)}    sharpe     ${bt.sharpe.toFixed(2).padStart(9)}`);
        print(`  trades     ${String(bt.trades).padStart(9)}    win rate   ${(bt.winRate * 100).toFixed(0).padStart(8)}%`);
        printNode(<EquityChart a={bt.equity} b={bt.hold} />);
        print(bt.ret >= bt.buyHold ? "beat buy & hold on this window. one window proves nothing." : "lost to buy & hold here. most crossovers do. that's the point.", "dim");
        return;
      }
      case "git": {
        if (args[0] !== "log") return print("git: try `git log`", "err");
        setBusy(true);
        try {
          const repos: { name: string }[] = await fetch(
            `https://api.github.com/users/${profile.githubUser}/repos?sort=pushed&per_page=4`,
          ).then((r) => r.json());
          const lists = await Promise.all(
            repos.slice(0, 3).map((r) =>
              fetch(`https://api.github.com/repos/${profile.githubUser}/${r.name}/commits?per_page=3`)
                .then((x) => x.json())
                .then((cs: { sha: string; commit: { message: string; author: { date: string } } }[]) =>
                  Array.isArray(cs) ? cs.map((c) => ({ repo: r.name, sha: c.sha.slice(0, 7), msg: c.commit.message.split("\n")[0], date: c.commit.author.date })) : [],
                ),
            ),
          );
          const commits = lists.flat().sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 8);
          if (!commits.length) throw new Error();
          for (const c of commits) {
            printNode(
              <p className="truncate">
                <span className="text-amber">{c.sha}</span> <span className="text-peri">{c.repo}</span> {c.msg}{" "}
                <span className="text-fg-faint">({ago(c.date)})</span>
              </p>,
            );
          }
        } catch {
          print("git: GitHub API unavailable right now (rate-limited?)", "err");
        } finally {
          setBusy(false);
        }
        return;
      }
      case "lights":
        print("lights out and away we go… scroll down to the gantry", "dim");
        window.dispatchEvent(new Event("lights:start"));
        return;
      case "box":
        print("box box, box box. pitting for the résumé.", "amber");
        window.open(profile.resume, "_blank", "noopener");
        return;
      case "forza":
        print("Forza Ferrari. #44", "err");
        return;
      case "sudo":
        print("nice try. this incident will be reported.", "err");
        return;
      case "exit":
        print("there's no leaving. try `contact` instead.", "dim");
        return;
      case "echo":
        print(args.join(" "));
        return;
      case "date":
        print(new Date().toString());
        return;
      default:
        print(`${cmd}: command not found. try help`, "err");
    }
  };

  const submit = async (cmd: string) => {
    setTouched(true);
    setInput("");
    await run(cmd);
  };

  // Projects elsewhere on the page can ask the terminal to run a demo command.
  useEffect(() => {
    const onRun = (e: Event) => {
      const cmd = (e as CustomEvent<string>).detail;
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => submit(cmd), 450);
    };
    window.addEventListener("term:run", onRun);
    return () => window.removeEventListener("term:run", onRun);
  });

  // A first command types itself once the terminal is on screen, unless the visitor got there first.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const demo = "whoami";
      let i = 0;
      const tick = () => {
        if (document.activeElement === inputRef.current) return;
        if (i <= demo.length) {
          setInput(demo.slice(0, i++));
          timer = window.setTimeout(tick, reduce ? 0 : 90);
        } else submit(demo);
      };
      timer = window.setTimeout(tick, 900);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!busy) submit(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const i = Math.min(history.current.length - 1, hIdx.current + 1);
      if (i >= 0) {
        hIdx.current = i;
        setInput(history.current[i]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const i = hIdx.current - 1;
      hIdx.current = Math.max(-1, i);
      setInput(i >= 0 ? history.current[i] : "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const names = ["help", "whoami", "about", "projects", "open", "stack", "contact", "resume", "ls", "cd", "clear", "history", "neofetch", "price", "backtest", "git log", "resp", ...REDIS_COMMANDS];
      const hit = names.find((n) => n.toLowerCase().startsWith(input.toLowerCase()) && input.length > 0);
      if (hit) setInput(hit + " ");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const tone: Record<Kind, string> = {
    in: "text-fg",
    out: "text-fg-dim",
    dim: "text-fg-faint",
    err: "text-coral",
    ok: "text-mint",
    amber: "text-amber",
  };

  return (
    <div ref={rootRef} id="terminal" className="pixel-box flex h-[24rem] flex-col sm:h-[27rem]" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
      <div className="flex items-center justify-between gap-3 border-b-2 border-line bg-ink px-3 py-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 bg-coral" />
          <span className="size-2.5 bg-amber" />
          <span className="size-2.5 bg-mint" />
        </div>
        <p className="truncate font-pixel text-[10px] text-fg-faint uppercase">hadi@manipal: ~ · try me</p>
        <span className={`size-2 ${busy ? "bg-amber blink" : "bg-mint"}`} aria-hidden="true" />
      </div>
      <div
        ref={outRef}
        className="flex-1 overflow-y-auto px-3 py-3 font-mono text-[12.5px] leading-relaxed sm:px-4 sm:text-[13px]"
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
      >
        {lines.map((l) =>
          l.node ? (
            <div key={l.id} className="text-fg-dim">
              {l.node}
            </div>
          ) : (
            <p key={l.id} className={`break-words whitespace-pre-wrap ${tone[l.kind]}`}>
              {l.kind === "in" ? (
                <>
                  <span className="text-mint">{PROMPT}</span>
                  {l.text!.slice(PROMPT.length)}
                </>
              ) : (
                l.text
              )}
            </p>
          ),
        )}
        <div className="flex items-center gap-2">
          <label htmlFor="term-input" className="shrink-0 text-mint">
            {PROMPT}
          </label>
          <input
            id="term-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setTouched(true);
              setInput(e.target.value);
            }}
            onKeyDown={onKey}
            disabled={busy}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-label="Terminal command"
            className="min-w-0 flex-1 bg-transparent font-mono text-fg caret-mint outline-none"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 border-t-2 border-line bg-ink px-3 py-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              submit(s);
            }}
            className={`cursor-pointer border-2 border-line px-2 font-mono text-[11px] leading-6 text-fg-dim transition-colors hover:border-mint/60 hover:text-mint ${!touched && s === "SET coin btc" ? "border-mint/50 text-mint" : ""}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
