import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "article";
}) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref as never} className={`reveal ${inView ? "is-in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

export function Section({ id, children, tone = "", className = "" }: { id: string; children: ReactNode; tone?: string; className?: string }) {
  return (
    <section id={id} className={`relative py-24 sm:py-28 ${tone} ${className}`}>
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeader({ index, title, children }: { index: string; title: string; children?: ReactNode }) {
  return (
    <Reveal className="mb-10 sm:mb-12">
      <p className="font-pixel text-xs text-mint">{index}</p>
      <h2 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{title}</h2>
      {children && <p className="mt-4 max-w-2xl text-lg text-fg-dim">{children}</p>}
    </Reveal>
  );
}

export function Tag({ children, tone = "peri" }: { children: ReactNode; tone?: "peri" | "dim" }) {
  return (
    <span className={`inline-block font-display text-sm ${tone === "peri" ? "text-peri" : "text-fg-dim"}`}>{children}</span>
  );
}

export function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 bg-fg-faint" />
      <span>{children}</span>
    </li>
  );
}
