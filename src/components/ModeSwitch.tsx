import { useEffect, useRef, useState } from "react";
import { commitMode, MODE_ORDER, MODES, setMode, useMode, type Mode } from "../modes";

/** Segmented "view as" control. */
export function ModeSwitch({ compact = false }: { compact?: boolean }) {
  const { mode } = useMode();
  return (
    <div role="radiogroup" aria-label="View this portfolio as" className="flex items-center gap-1">
      {MODE_ORDER.map((m) => {
        const on = m === mode;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setMode(m)}
            className={`pixel-notch flex cursor-pointer items-center gap-1.5 font-pixel uppercase transition-colors ${
              compact ? "px-2 py-1.5 text-[10px]" : "px-2.5 py-1.5 text-[10px] sm:text-[11px]"
            } ${on ? "text-ink" : "bg-bg text-fg-dim hover:text-fg"}`}
            style={on ? { background: MODES[m].accent } : undefined}
          >
            <span aria-hidden="true" className="font-mono text-[11px] normal-case">
              {MODES[m].glyph}
            </span>
            {MODES[m].label}
          </button>
        );
      })}
    </div>
  );
}

/** Floating dock so the mode can be changed from anywhere once you're past the hero. */
export function ModeDock() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => {
      const hero = document.getElementById("top");
      const past = hero ? hero.getBoundingClientRect().bottom < 0 : window.scrollY > 600;
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 140;
      setShow(past && !atEnd);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div
      className={`fixed bottom-4 left-1/2 z-40 -translate-x-1/2 transition-all duration-300 ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}
      aria-hidden={!show}
    >
      <div className="pixel-box flex items-center gap-2 bg-ink/95 px-2 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-sm">
        <span className="hidden pl-1 font-pixel text-[9px] text-fg-faint uppercase sm:inline">View as</span>
        <ModeSwitch compact />
      </div>
    </div>
  );
}

/** Pixel wipe: tiles fill in the next mode's accent, the content swaps underneath, then tiles clear. */
export function ModeTransition() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = false;

    const onRequest = (e: Event) => {
      const next = (e as CustomEvent<Mode>).detail;
      e.preventDefault(); // tell setMode() we're handling it
      if (reduce || running) {
        commitMode(next);
        return;
      }
      const cv = ref.current;
      if (!cv) return commitMode(next);
      running = true;
      const cell = 28;
      const cols = Math.ceil(window.innerWidth / cell);
      const rows = Math.ceil(window.innerHeight / cell);
      cv.width = cols;
      cv.height = rows;
      const g = cv.getContext("2d")!;
      g.clearRect(0, 0, cols, rows);
      // Fill sweeps from the left with a little noise, clears the same way
      const order = Array.from({ length: cols * rows }, (_, i) => i).sort(
        (a, b) => (a % cols) + Math.random() * cols * 0.6 - ((b % cols) + Math.random() * cols * 0.6),
      );
      const accent = MODES[next].accent;
      const start = performance.now();
      const FILL = 260;
      const HOLD = 70;
      const CLEAR = 300;
      let committed = false;
      const step = (now: number) => {
        const t = now - start;
        if (t < FILL) {
          const upto = Math.floor(order.length * (t / FILL));
          for (let i = 0; i < upto; i++) {
            const c = order[i];
            g.fillStyle = (c * 7) % 11 < 2 ? "#0b0d1e" : accent;
            g.fillRect(c % cols, Math.floor(c / cols), 1, 1);
          }
        } else if (t < FILL + HOLD) {
          g.fillStyle = accent;
          g.fillRect(0, 0, cols, rows);
          if (!committed) {
            committed = true;
            commitMode(next);
          }
        } else {
          const k = Math.min(1, (t - FILL - HOLD) / CLEAR);
          const upto = Math.floor(order.length * k);
          for (let i = 0; i < upto; i++) g.clearRect(order[i] % cols, Math.floor(order[i] / cols), 1, 1);
          if (k >= 1) {
            running = false;
            return;
          }
        }
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    window.addEventListener("mode:request", onRequest);
    return () => {
      window.removeEventListener("mode:request", onRequest);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pixelated pointer-events-none fixed inset-0 z-[60] size-full" />;
}
