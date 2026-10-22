import type { Bar } from "./btc";

export type Backtest = {
  fast: number;
  slow: number;
  fee: number;
  bars: number;
  trades: number;
  winRate: number;
  ret: number;
  buyHold: number;
  maxDrawdown: number;
  sharpe: number;
  equity: number[];
  hold: number[];
};

/** 4h bars → periods per year, for annualising the Sharpe ratio. */
const PERIODS_PER_YEAR = 6 * 365;

/**
 * SMA crossover, long/flat. The signal is computed on the close of bar t and
 * only earns bar t+1's return, so there is no lookahead. Fees are charged on
 * every position change.
 */
export function smaCrossover(bars: Bar[], fast = 10, slow = 30, fee = 0.001): Backtest {
  const c = bars.map((b) => b.c);
  const sma = (n: number) => {
    const out: number[] = new Array(c.length).fill(NaN);
    let sum = 0;
    for (let i = 0; i < c.length; i++) {
      sum += c[i];
      if (i >= n) sum -= c[i - n];
      if (i >= n - 1) out[i] = sum / n;
    }
    return out;
  };
  const f = sma(fast);
  const s = sma(slow);
  const start = slow - 1;

  let eq = 1;
  let pos = 0;
  let entryEq = 1;
  let trades = 0;
  let wins = 0;
  let peak = 1;
  let mdd = 0;
  const equity = [1];
  const hold = [1];
  const rets: number[] = [];

  for (let t = start + 1; t < c.length; t++) {
    const signal = f[t - 1] > s[t - 1] ? 1 : 0;
    if (signal !== pos) {
      eq *= 1 - fee;
      if (signal === 1) entryEq = eq;
      else {
        trades++;
        if (eq > entryEq) wins++;
      }
      pos = signal;
    }
    const r = c[t] / c[t - 1] - 1;
    const before = eq;
    eq *= 1 + pos * r;
    rets.push(eq / before - 1);
    peak = Math.max(peak, eq);
    mdd = Math.min(mdd, eq / peak - 1);
    equity.push(eq);
    hold.push(c[t] / c[start]);
  }
  if (pos === 1) {
    trades++;
    if (eq > entryEq) wins++;
  }

  const mean = rets.reduce((a, b) => a + b, 0) / Math.max(1, rets.length);
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, rets.length - 1));

  return {
    fast,
    slow,
    fee,
    bars: c.length - start - 1,
    trades,
    winRate: trades ? wins / trades : 0,
    ret: eq - 1,
    buyHold: c[c.length - 1] / c[start] - 1,
    maxDrawdown: mdd,
    sharpe: sd > 0 ? (mean / sd) * Math.sqrt(PERIODS_PER_YEAR) : 0,
    equity,
    hold,
  };
}
