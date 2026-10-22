import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { fmtLap, lapStore, markSector, SECTORS, startLap } from "../lib/lap";
import { CarSide, CarTop } from "./F1Car";

const PURPLE = "#b48cff";
const YELLOW = "#ffd23f";

export const useLap = () => useSyncExternalStore(lapStore.subscribe, lapStore.get, lapStore.get);

/** Starts the lap on the first real scroll and records each sector as its section reaches mid-screen. */
export function useLapTimer() {
  useEffect(() => {
    const on = () => {
      if (window.scrollY > 40) startLap();
      const mid = window.innerHeight * 0.5;
      for (const s of SECTORS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (el.getBoundingClientRect().top <= mid || (atBottom && s.id === "contact")) markSector(s.id);
      }
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
}

/** Wide screens: a strip of track down the right edge with the #44 driving it, plus a timing tower. */
export function RaceRail() {
  const lap = useLap();
  const carRef = useRef<HTMLDivElement>(null);
  const brakeRef = useRef<HTMLSpanElement>(null);
  const [marks, setMarks] = useState<{ id: string; label: string; pos: number }[]>([]);

  useEffect(() => {
    const measure = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setMarks(
        SECTORS.map((s) => {
          const el = document.getElementById(s.id);
          const pos = el ? Math.min(1, Math.max(0, (el.offsetTop - window.innerHeight * 0.5) / max)) : 0;
          return { id: s.id, label: s.label, pos };
        }),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);

    let raf = 0;
    let lastY = window.scrollY;
    let v = 0;
    const loop = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const k = Math.min(1, window.scrollY / max);
      const dv = window.scrollY - lastY;
      lastY = window.scrollY;
      const prev = v;
      v += (dv - v) * 0.2;
      if (carRef.current) carRef.current.style.top = `calc(${k * 100}% - ${k * 45}px)`;
      // Brake discs glow when the car is slowing down
      if (brakeRef.current) brakeRef.current.style.opacity = prev > 2 && v < prev * 0.8 ? "1" : "0";
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed top-[72px] right-4 bottom-4 z-30 hidden w-7 min-[1290px]:block">
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(180deg, #dc1d1d 0 6px, #f3f1ff 6px 12px) left/3px 100% no-repeat, repeating-linear-gradient(180deg, #dc1d1d 0 6px, #f3f1ff 6px 12px) right/3px 100% no-repeat, #1a1b30",
          }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2" style={{ background: "repeating-linear-gradient(180deg, #3a3d5c 0 6px, transparent 6px 14px)" }} />
        {marks.map((m) => (
          <div key={m.id} className="absolute inset-x-0" style={{ top: `${m.pos * 100}%` }}>
            <div className="h-0.5 w-full bg-fg/70" />
            <span className="absolute top-0 right-9 -translate-y-1/2 font-pixel text-[9px] text-fg-faint">{m.label}</span>
          </div>
        ))}
        <div ref={carRef} className="absolute left-1/2 w-[18px] -translate-x-1/2" style={{ top: 0 }}>
          <CarTop className="w-full" />
          {/* front brake discs glow when the car slows */}
          <span ref={brakeRef} className="absolute inset-x-0 bottom-[18%] h-1 bg-amber opacity-0 shadow-[0_0_8px_2px_#ffb454] transition-opacity" />
        </div>
      </div>

      {lap.start !== null && (
        <div aria-hidden="true" className="pointer-events-none fixed bottom-4 left-4 z-30 hidden w-52 min-[1290px]:block">
          <div className="pixel-box px-3 py-2.5 font-mono text-[11px]">
            <p className="mb-1.5 flex items-center justify-between font-pixel text-[10px] uppercase">
              <span className="text-fg">Your lap</span>
              <span className="text-[#ff5a4f]">#44</span>
            </p>
            {SECTORS.map((s) => {
              const sp = lap.splits.find((x) => x.id === s.id);
              return (
                <p key={s.id} className="flex justify-between gap-2 leading-5">
                  <span className="text-fg-faint">
                    {s.label} <span className="text-fg-dim">{s.name}</span>
                  </span>
                  <span className="tabular-nums" style={{ color: sp ? (!sp.valid ? "#6d71a0" : sp.best ? PURPLE : YELLOW) : "#6d71a0" }}>
                    {sp ? (sp.valid ? fmtLap(sp.ms) : "skipped") : "--:--.---"}
                  </span>
                </p>
              );
            })}
            {lap.total !== null && (
              <p className="mt-1 flex justify-between border-t-2 border-line pt-1 font-semibold">
                <span className="text-fg">LAP</span>
                <span className="tabular-nums" style={{ color: lap.deleted ? "#ff7a8a" : lap.newBest ? PURPLE : YELLOW }}>
                  {lap.deleted ? "DELETED" : fmtLap(lap.total)}
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** Chequered flag at the bottom of the page: the #44 crosses the line when it comes into view. */
export function Finish() {
  const lap = useLap();
  const ref = useRef<HTMLCanvasElement>(null);
  const [crossed, setCrossed] = useState(false);
  const [rolling, setRolling] = useState(false);
  const burst = useRef(false);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = 0;
    let fired = false;
    let confetti: { x: number; y: number; vy: number; vx: number; c: string }[] = [];

    const draw = () => {
      t++;
      const rect = cv.getBoundingClientRect();
      const PX = rect.width < 640 ? 3 : 4;
      const W = Math.ceil(rect.width / PX);
      const H = Math.ceil(rect.height / PX);
      if (cv.width !== W || cv.height !== H) {
        cv.width = W;
        cv.height = H;
      }
      ctx.clearRect(0, 0, W, H);
      const top = H - 13;
      const fx = Math.round(W * 0.66);

      // Grandstand lights in the distance
      for (let x = 2; x < W; x += 5) {
        ctx.fillStyle = (x * 7 + Math.floor(t / 40)) % 9 < 2 ? "#ffd27a" : "#2a2e57";
        ctx.fillRect(x, top - 9 - (x % 3), 2, 1);
      }
      // Track and kerb
      ctx.fillStyle = "#1a1b30";
      ctx.fillRect(0, top, W, 13);
      for (let x = 0; x < W; x += 3) {
        ctx.fillStyle = Math.floor(x / 3) % 2 ? "#f3f1ff" : "#dc1d1d";
        ctx.fillRect(x, top - 1, 3, 1);
      }
      // Chequered finish line + waving flag on a gantry post
      for (let y = top; y < top + 13; y++)
        for (let x = fx; x < fx + 4; x++) {
          ctx.fillStyle = (Math.floor((x - fx) / 2) + Math.floor((y - top) / 2)) % 2 ? "#f3f1ff" : "#0b0d1e";
          ctx.fillRect(x, y, 1, 1);
        }
      ctx.fillStyle = "#6d71a0";
      ctx.fillRect(fx + 6, top - 22, 1, 22);
      for (let y = 0; y < 6; y++)
        for (let x = 0; x < 10; x++) {
          const wave = reduce ? 0 : Math.round(Math.sin(t * 0.12 + x * 0.6) * 0.8);
          ctx.fillStyle = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? "#f3f1ff" : "#0b0d1e";
          ctx.fillRect(fx + 7 + x, top - 22 + y + wave, 1, 1);
        }

      if (burst.current && !fired) {
        fired = true;
        if (!reduce)
          confetti = Array.from({ length: 70 }, () => ({
            x: Math.random() * W,
            y: -Math.random() * 20,
            vy: 0.2 + Math.random() * 0.4,
            vx: (Math.random() - 0.5) * 0.3,
            c: ["#dc1d1d", "#ffd23f", "#f3f1ff", "#7fe0c3", "#b48cff"][Math.floor(Math.random() * 5)],
          }));
      }
      confetti = confetti.filter((c) => {
        c.y += c.vy;
        c.x += c.vx + Math.sin((t + c.y) * 0.1) * 0.15;
        ctx.fillStyle = c.c;
        ctx.fillRect(Math.round(c.x), Math.round(c.y), 1, 1);
        return c.y < H;
      });
      raf = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setRolling(true);
        window.setTimeout(() => {
          burst.current = true;
          setCrossed(true);
        }, reduce ? 0 : 1500);
      },
      { threshold: 0.6 },
    );
    io.observe(cv);
    raf = requestAnimationFrame(draw);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="relative mt-16">
      <canvas ref={ref} aria-hidden="true" className="pixelated block h-[140px] w-full sm:h-[160px]" />
      {/* The #44 rolls in and stops just past the line */}
      <div
        aria-hidden="true"
        className="absolute bottom-[6px] w-[clamp(150px,18vw,240px)] transition-[left] ease-out sm:bottom-[10px]"
        style={{ left: rolling ? "calc(66% - clamp(150px, 18vw, 240px) * 0.7)" : "-40%", transitionDuration: "1700ms" }}
        data-rolling={rolling && !crossed ? "on" : "off"}
        data-brakes={rolling && !crossed ? "on" : "off"}
      >
        <CarSide />
      </div>
      <div
        aria-live="polite"
        className={`absolute top-3 left-4 transition-opacity duration-500 sm:left-6 lg:left-[max(2rem,calc((100%-1180px)/2+2rem))] ${crossed ? "opacity-100" : "opacity-0"}`}
      >
        <p className="font-display text-3xl font-semibold text-amber">P1</p>
        <p className="font-mono text-xs text-fg-dim">
          {lap.total !== null && lap.deleted ? (
            <>Lap deleted: track limits. You skipped a few sectors. Scroll the whole page for a clean lap.</>
          ) : lap.total !== null ? (
            <>
              Your lap {fmtLap(lap.total)}
              {lap.bestTotal !== null && !lap.newBest && <> · best {fmtLap(lap.bestTotal)}</>}
              {lap.newBest && <span style={{ color: PURPLE }}> · personal best</span>}
            </>
          ) : (
            "Chequered flag. Thanks for the lap."
          )}
        </p>
      </div>
    </div>
  );
}
