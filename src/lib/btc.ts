/** Real BTC/USD 4h candles from CoinGecko, shared by the hero chart and the terminal's backtester. */

export type Bar = { t: number; o: number; h: number; l: number; c: number };
export type BtcState = { bars: Bar[]; source: "live" | "offline"; ready: boolean };

/** Offline fallback: a seeded random walk, clearly labelled as such wherever it's shown. */
function offlineBars(): Bar[] {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const out: Bar[] = [];
  let p = 80000;
  const start = Date.now() - 180 * 4 * 3600 * 1000;
  for (let i = 0; i < 180; i++) {
    const o = p;
    const c = o * (1 + (rnd() - 0.48) * 0.018);
    out.push({ t: start + i * 4 * 3600 * 1000, o, c, h: Math.max(o, c) * (1 + rnd() * 0.006), l: Math.min(o, c) * (1 - rnd() * 0.006) });
    p = c;
  }
  return out;
}

let state: BtcState = { bars: offlineBars(), source: "offline", ready: false };
const listeners = new Set<() => void>();
const set = (s: BtcState) => {
  state = s;
  listeners.forEach((l) => l());
};

let started = false;
export function loadBtc() {
  if (started) return;
  started = true;
  const fetchBars = () =>
    fetch("https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=30")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: unknown) => {
        if (Array.isArray(d) && d.length > 30) {
          set({ bars: (d as number[][]).map(([t, o, h, l, c]) => ({ t, o, h, l, c })), source: "live", ready: true });
        } else set({ ...state, ready: true });
      })
      .catch(() => set({ ...state, ready: true }));
  fetchBars();
  window.setInterval(fetchBars, 5 * 60_000);
}

export const btcStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export const usd = (n: number, digits = 0) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
