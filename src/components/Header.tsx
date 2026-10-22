import { useEffect, useState } from "react";
import { profile, sections } from "../data";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b-2 transition-colors duration-300 ${scrolled ? "border-line bg-ink/90 backdrop-blur-sm" : "border-transparent bg-transparent"}`}
    >
      <div className="mx-auto flex h-14 w-full max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5 font-display text-lg font-semibold text-fg no-underline">
          <span className="pixel-notch grid size-8 place-items-center bg-amber font-pixel text-[11px] text-ink">MH</span>
          <span className="hidden text-base whitespace-nowrap min-[360px]:inline sm:text-lg">Mohammed Hadi</span>
        </a>
        <nav aria-label="Primary" className="flex items-center gap-5">
          <ul className="hidden items-center gap-5 lg:flex">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="font-display text-fg-dim no-underline transition-colors hover:text-fg">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <a href={profile.resume} target="_blank" rel="noreferrer" className="pixel-button group text-amber" aria-label="Résumé (PDF)">
            <span className="group-hover:hidden">Résumé</span>
            <span className="hidden group-hover:inline">Box box</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
