/**
 * A tiny in-browser Redis, mirroring the command set of redis-java.
 * Replies are modelled as RESP types so the terminal can show both the
 * redis-cli rendering and the raw wire bytes.
 */

export type Reply =
  | { t: "simple"; v: string }
  | { t: "bulk"; v: string }
  | { t: "int"; v: number }
  | { t: "nil" }
  | { t: "err"; v: string }
  | { t: "array"; v: Reply[] };

type Entry = { v: string; exp?: number };

const ok: Reply = { t: "simple", v: "OK" };
const err = (v: string): Reply => ({ t: "err", v });
const wrongArgs = (cmd: string) => err(`ERR wrong number of arguments for '${cmd.toLowerCase()}' command`);
const notInt = err("ERR value is not an integer or out of range");

export const REDIS_COMMANDS = [
  "PING",
  "ECHO",
  "SET",
  "GET",
  "INCR",
  "INCRBY",
  "DECR",
  "DEL",
  "EXISTS",
  "KEYS",
  "TTL",
  "PTTL",
  "EXPIRE",
  "DBSIZE",
  "FLUSHALL",
  "INFO",
];

function glob(pattern: string) {
  const re = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(`^${re}$`);
}

export class MiniRedis {
  private store = new Map<string, Entry>();
  private readonly replId = Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

  private live(k: string) {
    const e = this.store.get(k);
    if (!e) return undefined;
    if (e.exp !== undefined && Date.now() >= e.exp) {
      this.store.delete(k);
      return undefined;
    }
    return e;
  }

  private incrBy(k: string, by: number): Reply {
    const e = this.live(k);
    const cur = e ? Number(e.v) : 0;
    if (!Number.isInteger(cur)) return notInt;
    const next = cur + by;
    this.store.set(k, { v: String(next), exp: e?.exp });
    return { t: "int", v: next };
  }

  exec(argv: string[]): Reply {
    if (!argv.length) return err("ERR empty command");
    const [raw, ...a] = argv;
    const cmd = raw.toUpperCase();
    switch (cmd) {
      case "PING":
        return a.length ? { t: "bulk", v: a.join(" ") } : { t: "simple", v: "PONG" };
      case "ECHO":
        return a.length === 1 ? { t: "bulk", v: a[0] } : wrongArgs(cmd);
      case "SET": {
        if (a.length < 2) return wrongArgs(cmd);
        const [k, v, ...opts] = a;
        let exp: number | undefined;
        let nx = false;
        let xx = false;
        for (let i = 0; i < opts.length; i++) {
          const o = opts[i].toUpperCase();
          if (o === "PX" || o === "EX") {
            const n = Number(opts[++i]);
            if (!Number.isInteger(n) || n <= 0) return err("ERR invalid expire time in 'set' command");
            exp = Date.now() + (o === "PX" ? n : n * 1000);
          } else if (o === "NX") nx = true;
          else if (o === "XX") xx = true;
          else return err("ERR syntax error");
        }
        const exists = !!this.live(k);
        if ((nx && exists) || (xx && !exists)) return { t: "nil" };
        this.store.set(k, { v, exp });
        return ok;
      }
      case "GET": {
        if (a.length !== 1) return wrongArgs(cmd);
        const e = this.live(a[0]);
        return e ? { t: "bulk", v: e.v } : { t: "nil" };
      }
      case "INCR":
        return a.length === 1 ? this.incrBy(a[0], 1) : wrongArgs(cmd);
      case "DECR":
        return a.length === 1 ? this.incrBy(a[0], -1) : wrongArgs(cmd);
      case "INCRBY": {
        if (a.length !== 2) return wrongArgs(cmd);
        const by = Number(a[1]);
        return Number.isInteger(by) ? this.incrBy(a[0], by) : notInt;
      }
      case "DEL": {
        if (!a.length) return wrongArgs(cmd);
        let n = 0;
        for (const k of a) if (this.live(k) && this.store.delete(k)) n++;
        return { t: "int", v: n };
      }
      case "EXISTS":
        return a.length ? { t: "int", v: a.filter((k) => this.live(k)).length } : wrongArgs(cmd);
      case "KEYS": {
        if (a.length !== 1) return wrongArgs(cmd);
        const re = glob(a[0]);
        return { t: "array", v: [...this.store.keys()].filter((k) => this.live(k) && re.test(k)).map((k) => ({ t: "bulk", v: k }) as Reply) };
      }
      case "TTL":
      case "PTTL": {
        if (a.length !== 1) return wrongArgs(cmd);
        const e = this.live(a[0]);
        if (!e) return { t: "int", v: -2 };
        if (e.exp === undefined) return { t: "int", v: -1 };
        const ms = e.exp - Date.now();
        return { t: "int", v: cmd === "TTL" ? Math.ceil(ms / 1000) : ms };
      }
      case "EXPIRE": {
        if (a.length !== 2) return wrongArgs(cmd);
        const s = Number(a[1]);
        if (!Number.isInteger(s)) return notInt;
        const e = this.live(a[0]);
        if (!e) return { t: "int", v: 0 };
        e.exp = Date.now() + s * 1000;
        return { t: "int", v: 1 };
      }
      case "DBSIZE":
        return { t: "int", v: [...this.store.keys()].filter((k) => this.live(k)).length };
      case "FLUSHALL":
        this.store.clear();
        return ok;
      case "INFO":
        return {
          t: "bulk",
          v: ["# Replication", "role:master", "connected_slaves:0", `master_replid:${this.replId}`, "master_repl_offset:0"].join("\n"),
        };
      default:
        return err(`ERR unknown command '${raw}', with args beginning with: ${a.map((x) => `'${x}'`).join(" ")}`);
    }
  }
}

/** redis-cli style rendering. */
export function formatReply(r: Reply, indent = ""): string {
  switch (r.t) {
    case "simple":
      return r.v;
    case "bulk":
      return r.v.includes("\n") ? r.v : `"${r.v}"`;
    case "int":
      return `(integer) ${r.v}`;
    case "nil":
      return "(nil)";
    case "err":
      return `(error) ${r.v}`;
    case "array":
      return r.v.length ? r.v.map((x, i) => `${indent}${i + 1}) ${formatReply(x, indent + "   ")}`).join("\n") : "(empty array)";
  }
}

const crlf = "\\r\\n";

/** The bytes a client sends: a RESP array of bulk strings. */
export const encodeCommand = (argv: string[]) =>
  `*${argv.length}${crlf}` + argv.map((a) => `$${new TextEncoder().encode(a).length}${crlf}${a}${crlf}`).join("");

/** The bytes the server answers with. */
export function encodeReply(r: Reply): string {
  switch (r.t) {
    case "simple":
      return `+${r.v}${crlf}`;
    case "bulk":
      return `$${new TextEncoder().encode(r.v).length}${crlf}${r.v.replace(/\n/g, crlf)}${crlf}`;
    case "int":
      return `:${r.v}${crlf}`;
    case "nil":
      return `$-1${crlf}`;
    case "err":
      return `-${r.v}${crlf}`;
    case "array":
      return `*${r.v.length}${crlf}` + r.v.map(encodeReply).join("");
  }
}

/** Split a command line the way redis-cli does: whitespace, with "double quoted" args. */
export function splitArgs(line: string): string[] {
  const out: string[] = [];
  const re = /"((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) out.push(m[1] !== undefined ? m[1].replace(/\\(.)/g, "$1") : (m[2] ?? m[3]));
  return out;
}
