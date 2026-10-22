import { useEffect } from "react";
import { Header } from "./components/Header";
import Leaderboard from "./components/Leaderboard";
import NightScene from "./components/NightScene";
import { RaceRail, useLapTimer } from "./components/Race";
import { About, Achievements, Contact, Experience, Hero, Projects, Stack } from "./components/Sections";

export default function App() {
  useLapTimer();
  // The browser looks for #anchors before React has rendered, so honour shared links like /#projects ourselves.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const jump = () => document.getElementById(id)?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    jump();
    // Fonts and GitHub metadata shift the layout after first paint; land again once they settle.
    const timer = window.setTimeout(jump, 700);
    document.fonts?.ready.then(jump);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <a href="#about" className="sr-only z-50 bg-mint px-3 py-2 font-display text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <NightScene />
      <Header />
      <main>
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Stack />
        <Achievements />
        <Contact />
      </main>
      <RaceRail />
      <Leaderboard />
    </>
  );
}
