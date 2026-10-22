/**
 * Times the visitor's real "lap" of the page: the clock starts on the first
 * scroll (lights out) and each section is a sector. Personal bests live in
 * localStorage so a second lap can go purple.
 */

export const SECTORS = [
  { id: "about", label: "S1", name: "About" },
  { id: "experience", label: "S2", name: "Experience" },
  { id: "projects", label: "S3", name: "Projects" },
  { id: "stack", label: "S4", name: "Stack" },
  { id: "achievements", label: "S5", name: "Achievements" },
  { id: "contact", label: "FIN", name: "Finish" },
] as const;

export type Split = { id: string; ms: number; best: boolean; valid: boolean };
export type LapState = { start: number | null; splits: Split[]; total: number | null; bestTotal: number | null; newBest: boolean; deleted: boolean };

const BEST_KEY = "lap-bests-v2";
/** Faster than this through a section means you jumped there: track limits. */
const MIN_SECTOR_MS = 400;

function readBests(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function writeBests(b: Record<string, number>) {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(b));
  } catch {
    /* storage unavailable: bests just won't persist */
  }
}

let state: LapState = { start: null, splits: [], total: null, bestTotal: readBests().lap ?? null, newBest: false, deleted: false };
const listeners = new Set<() => void>();
const set = (s: LapState) => {
  state = s;
  listeners.forEach((l) => l());
};

export const lapStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function startLap() {
  if (state.start === null) set({ ...state, start: performance.now() });
}

export function markSector(id: string) {
  if (state.start === null || state.splits.some((s) => s.id === id)) return;
  const now = performance.now();
  const prevEnd = state.start + state.splits.reduce((a, s) => a + s.ms, 0);
  const ms = now - prevEnd;
  const bests = readBests();
  const valid = ms >= MIN_SECTOR_MS;
  const best = valid && (bests[id] === undefined || ms < bests[id]);
  if (best) bests[id] = ms;
  const splits = [...state.splits, { id, ms, best, valid }];
  let { total, bestTotal, newBest, deleted } = state;
  if (id === SECTORS[SECTORS.length - 1].id) {
    total = now - state.start;
    deleted = splits.some((s) => !s.valid);
    newBest = !deleted && (bests.lap === undefined || total < bests.lap);
    if (newBest) bests.lap = total;
    bestTotal = bests.lap ?? null;
  }
  writeBests(bests);
  set({ ...state, splits, total, bestTotal, newBest, deleted });
}

/** 83456 → "1:23.456" */
export function fmtLap(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = Math.floor(ms % 1000);
  return `${m}:${String(s).padStart(2, "0")}.${String(r).padStart(3, "0")}`;
}
