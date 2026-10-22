import { useEffect, useState } from "react";
import { skills } from "../data";
import { CarSide, type Zone } from "./F1Car";
import { Reveal } from "./ui";

const GLOW: Record<Zone, string> = {
  cockpit: "#ffd23f",
  power: "#ff5a4f",
  ers: "#7fe0c3",
  telemetry: "#9db4ff",
};

/** Callout anchors in the car's 600×150 viewBox. */
const ANCHOR: Record<Zone, { x: number; y: number; below?: boolean }> = {
  cockpit: { x: 296, y: 30 },
  power: { x: 188, y: 70 },
  ers: { x: 288, y: 124, below: true },
  telemetry: { x: 478, y: 146, below: true },
};

/** The #44 as an x-ray technical drawing; each system lights up and maps to part of the stack. */
export default function Blueprint() {
  const [active, setActive] = useState<Zone>("power");
  const [touched, setTouched] = useState(false);

  // Walk through the systems on its own until someone takes the wheel
  useEffect(() => {
    if (touched || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const order = skills.map((s) => s.zone as Zone);
    const id = window.setInterval(() => setActive((z) => order[(order.indexOf(z) + 1) % order.length]), 2600);
    return () => window.clearInterval(id);
  }, [touched]);

  const pick = (z: Zone) => {
    setTouched(true);
    setActive(z);
  };
  const cur = skills.find((s) => s.zone === active)!;
  const a = ANCHOR[active];

  return (
    <div>
      <Reveal className="pixel-box overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line px-4 py-2 font-mono text-[11px] text-fg-faint">
          <span>#44 · x-ray · systems → stack</span>
          <span className="hidden sm:inline">pick a system below</span>
        </div>
        <div
          className="relative px-3 pt-14 pb-16 sm:px-10 sm:pt-16 sm:pb-20"
          style={{
            backgroundImage:
              "linear-gradient(#2a2e5700 15px, #2a2e5766 16px), linear-gradient(90deg, #2a2e5700 15px, #2a2e5766 16px)",
            backgroundSize: "16px 16px",
          }}
        >
          <div className="relative mx-auto max-w-4xl">
            <CarSide mode="xray" zone={active} className="w-full" title={`X-ray drawing of the #44 car, ${cur.part} highlighted`} />
            <div
              className="pointer-events-none absolute -translate-x-1/2 transition-[left,top,bottom] duration-300"
              style={{
                left: `${(a.x / 600) * 100}%`,
                top: a.below ? `${(a.y / 150) * 100}%` : undefined,
                bottom: a.below ? undefined : `${100 - (a.y / 150) * 100}%`,
              }}
            >
              <div className={`flex items-center ${a.below ? "flex-col" : "flex-col-reverse"}`}>
                <span className="h-5 w-0.5 sm:h-8" style={{ background: GLOW[active] }} />
                <span
                  className="border-2 bg-ink px-2 py-0.5 font-pixel text-[10px] whitespace-nowrap uppercase sm:text-xs"
                  style={{ borderColor: GLOW[active], color: GLOW[active] }}
                >
                  {cur.part}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {skills.map((g, i) => {
          const z = g.zone as Zone;
          const on = z === active;
          return (
            <Reveal key={g.group} delay={i * 60}>
              <button
                type="button"
                onMouseEnter={() => pick(z)}
                onFocus={() => pick(z)}
                onClick={() => pick(z)}
                aria-pressed={on}
                className="pixel-box block h-full w-full cursor-pointer p-5 text-left transition-shadow sm:p-6"
                style={on ? { boxShadow: `inset 0 0 0 2px ${GLOW[z]}` } : undefined}
              >
                <p className="flex items-center gap-2 font-pixel text-[10px] uppercase" style={{ color: GLOW[z] }}>
                  <span className="size-2" style={{ background: GLOW[z], opacity: on ? 1 : 0.4 }} />
                  {g.part}
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold">{g.group}</h3>
                <p className="mt-1 text-sm text-fg-dim">{g.why}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {g.items.map((s) => (
                    <li key={s} className="border-2 border-line bg-bg px-2.5 font-mono text-[13px] leading-7 text-fg-dim">
                      {s}
                    </li>
                  ))}
                </ul>
              </button>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
