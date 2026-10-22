import { useEffect, useRef, useState, type FormEvent } from "react";
import { saveName, savedName, secs, submitTime } from "../lib/leaderboard";

type Phase = "idle" | "arming" | "hold" | "go" | "done" | "jump";

const BEST_KEY = "reaction-best-v1";

function readBest(): number | null {
  try {
    const v = Number(localStorage.getItem(BEST_KEY));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
}

const verdict = (ms: number) =>
  ms < 120
    ? "Suspiciously fast. Were you guessing?"
    : ms < 200
      ? "Faster than a typical F1 start (~0.2s)."
      : ms < 280
        ? "Race-ready. Right in the F1 range."
        : ms < 400
          ? "Decent. The midfield is waiting."
          : "Still in the garage. Again?";

/** The five-light F1 start, as a reaction test. */
export default function StartLights() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [lit, setLit] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [sent, setSent] = useState<{ state: "idle" | "sending" | "ok" | "error"; text: string }>({ state: "idle", text: "" });
  const timers = useRef<number[]>([]);
  const goAt = useRef(0);

  useEffect(() => {
    setBest(readBest());
    setName(savedName());
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const start = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setResult(null);
    setSent({ state: "idle", text: "" });
    setLit(0);
    setPhase("arming");
    for (let i = 1; i <= 5; i++) later(() => setLit(i), i * 850);
    later(() => setPhase("hold"), 5 * 850);
    // Lights stay on for a random 0.4–2.6s, like the real thing
    later(() => {
      setLit(0);
      setPhase("go");
      goAt.current = performance.now();
      window.dispatchEvent(new Event("lights:out"));
    }, 5 * 850 + 400 + Math.random() * 2200);
  };

  const press = () => {
    if (phase === "idle" || phase === "done" || phase === "jump") return start();
    if (phase === "arming" || phase === "hold") {
      timers.current.forEach(clearTimeout);
      setLit(0);
      setPhase("jump");
      return;
    }
    const ms = performance.now() - goAt.current;
    setResult(ms);
    setPhase("done");
    if (best === null || ms < best) {
      setBest(ms);
      try {
        localStorage.setItem(BEST_KEY, String(Math.round(ms)));
      } catch {
        /* storage unavailable */
      }
    }
  };

  // Let the terminal's `lights` command start a run
  useEffect(() => {
    const on = () => {
      document.getElementById("start-lights")?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(start, 500);
    };
    window.addEventListener("lights:start", on);
    return () => window.removeEventListener("lights:start", on);
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (result === null || sent.state === "sending") return;
    setSent({ state: "sending", text: "Sending to race control…" });
    try {
      const r = await submitTime(name, result);
      saveName(name.trim());
      setSent({
        state: "ok",
        text: r.improved
          ? `P${r.rank} of ${r.total} on the global board`
          : `Your best ${secs(r.best)} stands · P${r.rank} of ${r.total}`,
      });
    } catch (err) {
      setSent({ state: "error", text: err instanceof Error ? err.message : "Couldn't submit right now" });
    }
  };

  const canSubmit = phase === "done" && result !== null && result >= 100 && result <= 1500;

  const message =
    phase === "idle"
      ? "F1 reaction test · tap to start, tap again when the lights go out"
      : phase === "arming" || phase === "hold"
        ? "Wait for it…"
        : phase === "go"
          ? "GO GO GO!"
          : phase === "jump"
            ? "Jump start! That's a penalty. Click to try again."
            : result !== null
              ? `${(result / 1000).toFixed(3)}s · ${verdict(result)}`
              : "";

  return (
    <div id="start-lights" className="pixel-box w-full max-w-[22rem] px-3 py-3">
      <button
        type="button"
        onClick={press}
        className="block w-full cursor-pointer text-left"
        aria-label={phase === "go" ? "Lights out: click now" : "F1 start lights reaction test"}
      >
        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className="pixel-notch flex flex-col gap-1 bg-[#08080f] p-1.5">
              {[0, 1].map((r) => (
                <span
                  key={r}
                  className={`pixel-notch block size-3.5 transition-colors duration-75 ${
                    lit >= n ? "bg-[#ff2a3a] shadow-[0_0_14px_3px_rgba(255,42,58,0.65)]" : "bg-[#2a1520]"
                  }`}
                />
              ))}
            </span>
          ))}
        </div>
        <p
          aria-live="polite"
          className={`mt-2 text-center font-mono text-[11px] leading-snug ${
            phase === "jump" ? "text-coral" : phase === "go" ? "text-mint" : phase === "done" ? "text-amber" : "text-fg-dim"
          }`}
        >
          {message}
        </p>
      </button>

      {canSubmit && sent.state !== "ok" && (
        <form onSubmit={submit} className="mt-2 flex gap-1.5">
          <label htmlFor="lb-name" className="sr-only">
            Name for the leaderboard
          </label>
          <input
            id="lb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={14}
            placeholder="your name"
            autoComplete="nickname"
            className="min-w-0 flex-1 border-2 border-line bg-bg px-2 py-1 font-mono text-[12px] text-fg outline-none placeholder:text-fg-faint focus:border-mint"
          />
          <button type="submit" disabled={sent.state === "sending" || name.trim().length < 2} className="pixel-button cursor-pointer !px-2.5 !py-1.5 !text-[12px] text-mint disabled:cursor-default disabled:opacity-50">
            Submit
          </button>
        </form>
      )}
      {sent.text && (
        <p aria-live="polite" className={`mt-1.5 text-center font-mono text-[11px] ${sent.state === "error" ? "text-coral" : sent.state === "ok" ? "text-mint" : "text-fg-dim"}`}>
          {sent.text}
        </p>
      )}

      <div className="mt-1.5 flex items-center justify-between gap-2 font-pixel text-[10px] text-fg-faint uppercase">
        <span>{best !== null ? `Your best · ${(best / 1000).toFixed(3)}s` : "No time yet"}</span>
        <button type="button" onClick={() => window.dispatchEvent(new Event("leaderboard:open"))} className="cursor-pointer text-amber uppercase hover:underline">
          Leaderboard ↗
        </button>
      </div>
    </div>
  );
}
