import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Media } from "../data";
import PixelArt from "./PixelArt";

const KEYWORDS: Record<string, RegExp> = {
  java: /\b(public|private|static|return|if|else|for|while|int|char|String|new|class|void|try|catch)\b/,
  python: /\b(def|return|if|else|for|in|not|is|None|self|import|from|and|or|float|len|sum|abs|max|min)\b/,
  c: /\b(int|char|return|if|else|for|while|switch|case|break|static|void)\b/,
  sql: /\b(CREATE|TABLE|IF|NOT|EXISTS|INTEGER|TEXT|PRIMARY|KEY|AUTOINCREMENT|UNIQUE|NULL|DEFAULT|REFERENCES)\b/,
};

/** A deliberately small highlighter: comments, strings, numbers, keywords. */
function highlight(code: string, lang: string): ReactNode[] {
  const comment = lang === "python" ? "#.*" : lang === "sql" ? "--.*" : "\\/\\/.*";
  const re = new RegExp(`(${comment})|("(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')|(\\b\\d+(?:\\.\\d+)?\\b)|(${KEYWORDS[lang].source})`, "g");
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    const cls = m[1] ? "text-fg-faint italic" : m[2] ? "text-amber" : m[3] ? "text-mint" : "text-peri";
    out.push(
      <span key={k++} className={cls}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  out.push(code.slice(last));
  return out;
}

/** Covers the media with pixel blocks, then clears them in random order. */
function useDissolve(trigger: unknown) {
  const ref = useRef<HTMLCanvasElement>(null);
  const seen = useRef(false);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const play = () => {
      const rect = cv.getBoundingClientRect();
      const cell = 12;
      const cols = Math.ceil(rect.width / cell);
      const rows = Math.ceil(rect.height / cell);
      cv.width = cols;
      cv.height = rows;
      const g = cv.getContext("2d")!;
      g.fillStyle = "#0f1126";
      g.fillRect(0, 0, cols, rows);
      const order = Array.from({ length: cols * rows }, (_, i) => i).sort(() => Math.random() - 0.5);
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 520);
        const upto = Math.floor(order.length * t);
        for (let i = 0; i < upto; i++) g.clearRect(order[i] % cols, Math.floor(order[i] / cols), 1, 1);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    if (seen.current) play();
    else {
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          seen.current = true;
          io.disconnect();
          play();
        }
      });
      io.observe(cv);
      return () => {
        io.disconnect();
        cancelAnimationFrame(raf);
      };
    }
    return () => cancelAnimationFrame(raf);
  }, [trigger]);
  return ref;
}

function Slide({ m }: { m: Media }) {
  if (m.kind === "img")
    return (
      <div className={`absolute inset-0 ${m.light ? "bg-[#f7f7f5] p-2" : "bg-ink"}`}>
        <img
          src={m.src}
          alt={m.alt}
          loading="lazy"
          decoding="async"
          className={`size-full ${m.fit === "contain" ? "object-contain" : "object-cover"}`}
          style={{ objectPosition: m.pos ?? "50% 50%" }}
        />
      </div>
    );
  if (m.kind === "code")
    return (
      <div className="absolute inset-0 flex flex-col bg-ink">
        <div className="flex items-center justify-between gap-3 border-b-2 border-line px-3 py-1.5 font-mono text-[11px] text-fg-faint">
          <span className="truncate text-fg-dim">{m.file}</span>
          <span className="shrink-0">excerpt</span>
        </div>
        <pre className="flex-1 overflow-hidden px-3 py-2.5 font-mono text-[11px] leading-[1.55] text-fg sm:text-[12px]">
          <code>{highlight(m.code, m.lang)}</code>
        </pre>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-ink to-transparent" />
      </div>
    );
  return (
    <div
      className="absolute inset-0 grid place-items-center bg-ink"
      style={{
        backgroundImage:
          "linear-gradient(#2a2e5700 11px, #2a2e5788 12px), linear-gradient(90deg, #2a2e5700 11px, #2a2e5788 12px)",
        backgroundSize: "12px 12px",
      }}
    >
      <PixelArt name={m.name} className="w-28 sm:w-36" />
    </div>
  );
}

const caption = (m: Media) => (m.kind === "code" ? m.file.split("/").pop() : m.caption);

export default function MediaFigure({ items, label }: { items: Media[]; label: string }) {
  const [i, setI] = useState(0);
  const dissolve = useDissolve(i);
  const m = items[i];
  const many = items.length > 1;

  return (
    <figure className="flex flex-col border-b-2 border-line md:border-r-2 md:border-b-0" aria-roledescription="carousel" aria-label={`${label} media`}>
      <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[22rem] md:flex-1">
        <Slide m={m} />
        <canvas ref={dissolve} aria-hidden="true" className="pixelated pointer-events-none absolute inset-0 size-full" />
      </div>
      <figcaption className="flex items-center justify-between gap-3 border-t-2 border-line bg-ink px-3 py-2 font-mono text-[11px] text-fg-dim">
        <span className="truncate">{caption(m)}</span>
        {many && (
          <span className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => setI((v) => (v - 1 + items.length) % items.length)}
              className="grid size-6 cursor-pointer place-items-center border-2 border-line font-pixel text-[10px] text-fg hover:border-mint/60 hover:text-mint"
            >
              ◀
            </button>
            <span aria-live="polite" className="tabular-nums">
              {i + 1}/{items.length}
            </span>
            <button
              type="button"
              aria-label="Next"
              onClick={() => setI((v) => (v + 1) % items.length)}
              className="grid size-6 cursor-pointer place-items-center border-2 border-line font-pixel text-[10px] text-fg hover:border-mint/60 hover:text-mint"
            >
              ▶
            </button>
          </span>
        )}
      </figcaption>
    </figure>
  );
}
