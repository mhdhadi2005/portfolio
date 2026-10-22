import { useEffect, useRef } from "react";
import { CarSide } from "./F1Car";

/**
 * The #44 on the hero grid. When you start scrolling it launches: ERS deploys,
 * wheels spin up, DRS opens once it's at speed. When the start lights go out it
 * revs on the spot with the brake discs glowing.
 */
export default function HeroCar() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let revUntil = 0;
    let idleSpin = 0;

    const onLightsOut = () => {
      revUntil = performance.now() + 1100;
    };
    window.addEventListener("lights:out", onLightsOut);

    const loop = (now: number) => {
      // Launch is measured from when the grid (bottom of the hero) is on screen, so on tall
      // phone layouts the car waits until you can actually see it before it pulls away.
      const hero = document.getElementById("top");
      const vh = window.innerHeight;
      const gridY = hero ? hero.getBoundingClientRect().bottom : vh;
      const lp = Math.min(1, Math.max(0, (vh - gridY - 40) / (vh * 0.45)));
      const dx = lp * lp * window.innerWidth * 1.3;
      const width = el.offsetWidth || 1;
      const revving = now < revUntil;
      if (revving && !reduce) idleSpin += 22;
      // Wheel radius is 34/600 of the car's width; roll without slipping.
      const deg = ((dx / ((34 / 600) * width)) * 180) / Math.PI + idleSpin;
      el.style.transform = `translate3d(${dx}px, ${revving && !reduce ? (Math.random() - 0.5) * 1.5 : 0}px, 0)`;
      el.style.setProperty("--wheel", `${deg}deg`);
      el.dataset.ers = (lp > 0.02 && lp < 0.7) || revving ? "on" : "off";
      el.dataset.brakes = revving ? "on" : "off";
      el.dataset.drs = lp > 0.25 ? "open" : "closed";
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("lights:out", onLightsOut);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute bottom-[6px] left-[4vw] z-10 w-[clamp(170px,21vw,300px)] will-change-transform sm:bottom-[10px]"
    >
      <CarSide />
    </div>
  );
}
