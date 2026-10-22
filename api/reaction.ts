import { Redis } from "@upstash/redis";

/**
 * Global start-lights leaderboard.
 *
 *   GET  /api/reaction        → { top: [{ name, ms }], total }
 *   POST /api/reaction        { name, ms } → { rank, best, total, improved }
 *
 * Storage is a Redis sorted set (score = best reaction in ms, lower is better),
 * plus a hash mapping each normalised name to how it should be displayed.
 */

const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});

const BOARD = "reaction:board";
const NAMES = "reaction:names";
const MAX_ENTRIES = 1000;
/** Below ~0.1s is a guess, not a reaction (the FIA uses the same threshold for jump starts). */
const MIN_MS = 100;
const MAX_MS = 1500;
const RATE_LIMIT = 6; // submissions per IP per minute

const BLOCKED = ["fuck", "shit", "cunt", "bitch", "nigg", "fag", "rape", "nazi", "porn", "dick", "cock", "pussy", "whore", "slut", "retard", "hitler"];

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

function cleanName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/[^A-Za-z0-9 _.-]/g, "").replace(/\s+/g, " ").trim().slice(0, 14);
  if (name.length < 2) return null;
  const flat = name.toLowerCase().replace(/[^a-z]/g, "");
  return BLOCKED.some((w) => flat.includes(w)) ? null : name;
}

export async function GET() {
  try {
    const raw = await redis.zrange<(string | number)[]>(BOARD, 0, 9, { withScores: true });
    const keys: string[] = [];
    const scores: number[] = [];
    for (let i = 0; i < raw.length; i += 2) {
      keys.push(String(raw[i]));
      scores.push(Number(raw[i + 1]));
    }
    const names = keys.length ? await redis.hmget<Record<string, string>>(NAMES, ...keys) : null;
    const total = await redis.zcard(BOARD);
    const top = keys.map((k, i) => ({ name: names?.[k] ?? k, ms: scores[i] }));
    return json({ top, total }, 200, { "cache-control": "public, s-maxage=5, stale-while-revalidate=30" });
  } catch {
    return json({ error: "Leaderboard unavailable" }, 503);
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rlKey = `reaction:rl:${ip}`;
    const hits = await redis.incr(rlKey);
    if (hits === 1) await redis.expire(rlKey, 60);
    if (hits > RATE_LIMIT) return json({ error: "Slow down: too many submissions, try again in a minute" }, 429);

    const body = (await request.json().catch(() => null)) as { name?: unknown; ms?: unknown } | null;
    const ms = Math.round(Number(body?.ms));
    if (!Number.isFinite(ms) || ms < MIN_MS || ms > MAX_MS) return json({ error: `Times must be between ${MIN_MS} and ${MAX_MS} ms` }, 400);
    const name = cleanName(body?.name);
    if (!name) return json({ error: "Pick a name: 2–14 letters or numbers" }, 400);

    const key = name.toLowerCase();
    const prev = await redis.zscore(BOARD, key);
    const improved = prev === null || ms < Number(prev);
    if (improved) {
      await redis.zadd(BOARD, { score: ms, member: key });
      await redis.hset(NAMES, { [key]: name });
      // Keep the board bounded: drop everyone below the top MAX_ENTRIES
      await redis.zremrangebyrank(BOARD, MAX_ENTRIES, -1);
    }
    const [rank, total] = await Promise.all([redis.zrank(BOARD, key), redis.zcard(BOARD)]);
    return json({ rank: rank === null ? null : rank + 1, best: improved ? ms : Number(prev), total, improved });
  } catch {
    return json({ error: "Leaderboard unavailable" }, 503);
  }
}
