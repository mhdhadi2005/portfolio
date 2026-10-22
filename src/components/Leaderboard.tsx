import { useEffect, useRef, useState } from "react";
import { fetchBoard, savedName, secs, type Board } from "../lib/leaderboard";

/** Modal top-10 for the start-lights test. Opens via the "leaderboard:open" window event. */
export default function Leaderboard() {
  const ref = useRef<HTMLDialogElement>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const open = () => {
      setError(false);
      ref.current?.showModal();
      fetchBoard()
        .then(setBoard)
        .catch(() => setError(true));
    };
    window.addEventListener("leaderboard:open", open);
    return () => window.removeEventListener("leaderboard:open", open);
  }, []);

  const me = savedName().toLowerCase();

  return (
    <dialog
      ref={ref}
      aria-labelledby="lb-title"
      className="pixel-box m-auto w-[min(26rem,calc(100vw-2rem))] p-0 text-fg backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      onClick={(e) => e.target === ref.current && ref.current?.close()}
    >
      <div className="flex items-center justify-between border-b-2 border-line bg-ink px-4 py-3">
        <h2 id="lb-title" className="font-display text-xl font-semibold">
          Start-lights leaderboard
        </h2>
        <button type="button" onClick={() => ref.current?.close()} className="pixel-button cursor-pointer !px-2.5 !py-1.5" aria-label="Close">
          ✕
        </button>
      </div>
      <div className="px-4 py-4">
        {error ? (
          <p className="font-mono text-sm text-coral">The leaderboard is offline right now. Your time is still saved on this device.</p>
        ) : !board ? (
          <p className="font-mono text-sm text-fg-dim">Loading times…</p>
        ) : board.top.length === 0 ? (
          <p className="font-mono text-sm text-fg-dim">No times yet. Be the first on the board.</p>
        ) : (
          <ol className="space-y-1 font-mono text-sm">
            {board.top.map((e, i) => {
              const mine = e.name.toLowerCase() === me;
              return (
                <li
                  key={e.name}
                  className={`flex items-center justify-between gap-3 px-2 py-1.5 ${mine ? "bg-amber/15 text-amber" : i === 0 ? "text-[#b48cff]" : "text-fg-dim"}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-6 text-right tabular-nums text-fg-faint">{i + 1}</span>
                    <span className="text-fg">{e.name}</span>
                    {mine && <span className="font-pixel text-[9px] uppercase">you</span>}
                  </span>
                  <span className="tabular-nums">{secs(e.ms)}</span>
                </li>
              );
            })}
          </ol>
        )}
        {board && board.total > 0 && (
          <p className="mt-3 font-pixel text-[10px] text-fg-faint uppercase">
            {board.total} driver{board.total === 1 ? "" : "s"} on the board · best time per name
          </p>
        )}
      </div>
    </dialog>
  );
}
