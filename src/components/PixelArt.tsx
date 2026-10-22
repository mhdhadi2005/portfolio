import { ART, PAL } from "../art";

export default function PixelArt({ name, className = "" }: { name: string; className?: string }) {
  const rows = ART[name] ?? [];
  const w = Math.max(...rows.map((r) => r.length));
  const cells: { x: number; y: number; c: string }[] = [];
  rows.forEach((row, y) => [...row].forEach((c, x) => PAL[c] && cells.push({ x, y, c })));

  return (
    <svg
      viewBox={`0 0 ${w} ${rows.length}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {cells.map(({ x, y, c }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={1.02}
          height={1.02}
          fill={PAL[c]}
          className={c === c.toUpperCase() ? "blink" : undefined}
          style={c === c.toUpperCase() ? { animationDelay: `${((x * 7 + y * 3) % 10) / 10}s` } : undefined}
        />
      ))}
    </svg>
  );
}
