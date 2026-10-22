/** Client for the global start-lights leaderboard (see /api/reaction). */

export type Entry = { name: string; ms: number };
export type Board = { top: Entry[]; total: number };
export type Submitted = { rank: number | null; best: number; total: number; improved: boolean };

const NAME_KEY = "reaction-name-v1";

export async function fetchBoard(): Promise<Board> {
  const r = await fetch("/api/reaction");
  if (!r.ok) throw new Error("Leaderboard unavailable");
  return r.json();
}

export async function submitTime(name: string, ms: number): Promise<Submitted> {
  const r = await fetch("/api/reaction", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, ms: Math.round(ms) }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error ?? "Couldn't submit right now");
  return data;
}

export function savedName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* storage unavailable */
  }
}

export const secs = (ms: number) => `${(ms / 1000).toFixed(3)}s`;
