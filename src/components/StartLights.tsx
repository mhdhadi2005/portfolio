import { useEffect, useRef, useState } from "react";

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
  const timers = useRef<number[]>([]);
  const goAt = useRef(0);

  useEffect(() => {
    setBest(readBest());
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const start = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setResult(null);
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
    <div id="start-lights" className="w-full max-w-[22rem]">
      <button
        type="button"
        onClick={press}
        className="pixel-box group block w-full cursor-pointer px-3 py-3 text-left"
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
        {best !== null && (
          <p className="mt-1 text-center font-pixel text-[10px] text-fg-faint uppercase">Your best · {(best / 1000).toFixed(3)}s</p>
        )}
      </button>
    </div>
  );
}
