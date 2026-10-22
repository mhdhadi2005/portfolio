import { useEffect, useRef } from "react";

type RGB = [number, number, number];

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

const SKY_TOP: RGB = [11, 13, 30];
const SKY_MID: RGB = [26, 22, 64];
const SKY_LOW: RGB = [58, 38, 92];
const GLOW: RGB = [150, 78, 104];

const MOON = "#f4ecd2";
const AMBER = "#ffb454";
const WARM = "#ffd27a";
const MINT = "#7fe0c3";

const PALM = ["..XX.XX..", ".X..X..X.", "X..XXX..X", "...X.X..."];
/** A small figure sitting on the hill with a laptop. "S" is the screen. */
const CODER = ["..XX....", "..XX....", ".XXXX.SS", "XXXXXXSS", "XX.XXXX.", "XXXXXXXX"];

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function hash(x: number, y: number) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

type Star = { x: number; y: number; b: number; ph: number; sp: number; big: boolean; col: string };
type Fly = { x: number; y: number; ph: number; sp: number };
type Shooter = { x: number; y: number; life: number };

/**
 * Pixel-art night over the Manipal hills: a fixed sky with stars and a moon,
 * and a landscape pinned to the bottom of the hero that scrolls away with it.
 */
export default function NightScene() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let PX = 4;
    let stars: Star[] = [];
    let flies: Fly[] = [];
    let houses: { x: number; w: number; h: number }[] = [];
    let palms: number[] = [];
    let shooter: Shooter | null = null;

    const sky = document.createElement("canvas");
    const skyCtx = sky.getContext("2d")!;
    let skyKey = "";

    function resize() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nPX = vw < 640 ? 3 : 4;
      const nW = Math.ceil(vw / nPX);
      const nH = Math.ceil(vh / nPX);
      // Mobile toolbars nudge the height constantly; keep the larger canvas instead of rebuilding.
      if (nPX === PX && nW === W && nH <= H && (H - nH) * PX < 160) return;
      PX = nPX;
      W = nW;
      H = nH;
      canvas.width = W;
      canvas.height = H;
      canvas.style.width = `${W * PX}px`;
      canvas.style.height = `${H * PX}px`;
      sky.width = W;
      sky.height = H;
      skyKey = "";

      const cols = ["#eceaff", "#eceaff", "#cfd8ff", "#ffe9c4", "#d9ccff"];
      stars = Array.from({ length: Math.round((W * H) / 110) }, (_, i) => ({
        x: Math.floor(hash(i, 1) * W),
        y: hash(i, 2) * H * 0.85,
        b: 0.25 + hash(i, 3) ** 2 * 0.75,
        ph: hash(i, 4) * Math.PI * 2,
        sp: 0.015 + hash(i, 5) * 0.04,
        big: hash(i, 6) < 0.05,
        col: cols[Math.floor(hash(i, 7) * cols.length)],
      }));
      flies = Array.from({ length: Math.round(W / 22) }, (_, i) => ({
        x: hash(i, 11) * W,
        y: hash(i, 12),
        ph: hash(i, 13) * 6.28,
        sp: 0.4 + hash(i, 14),
      }));
      houses = [];
      palms = [];
      const coderX = Math.round(W * 0.74);
      for (let x = 3; x < W; ) {
        const near = Math.abs(x - coderX) < 18;
        const r = hash(x, 31);
        if (!near && r < 0.2) {
          const w = 5 + Math.floor(hash(x, 32) * 7);
          houses.push({ x, w, h: 5 + Math.floor(hash(x, 33) * 6) });
          x += w + 2;
        } else if (!near && r < 0.42) {
          palms.push(x);
          x += 6 + Math.floor(hash(x, 34) * 9);
        } else x += 4;
      }
    }

    function renderSky(fade: number) {
      const key = `${Math.round(fade * 60)}:${W}x${H}`;
      if (key === skyKey) return;
      skyKey = key;
      const img = skyCtx.createImageData(W, H);
      const d = img.data;
      const step = 6;
      for (let y = 0; y < H; y++) {
        const t = y / Math.max(1, H - 1);
        const a = t < 0.55 ? t / 0.55 : 1;
        const b = t < 0.55 ? 0 : (t - 0.55) / 0.45;
        const glow = Math.pow(smooth(0.6, 1, t), 1.7) * 0.55 * fade;
        const col = [0, 1, 2].map((c) => {
          const base = SKY_TOP[c] + (SKY_MID[c] - SKY_TOP[c]) * a + (SKY_LOW[c] - SKY_MID[c]) * b * fade;
          return base + (GLOW[c] - base) * glow;
        });
        for (let x = 0; x < W; x++) {
          const th = BAYER4[(y & 3) * 4 + (x & 3)];
          const i = (y * W + x) * 4;
          d[i] = Math.min(255, Math.floor(col[0] / step + th) * step);
          d[i + 1] = Math.min(255, Math.floor(col[1] / step + th) * step);
          d[i + 2] = Math.min(255, Math.floor(col[2] / step + th) * step);
          d[i + 3] = 255;
        }
      }
      skyCtx.putImageData(img, 0, 0);
    }

    function drawMoon(cx: number, cy: number) {
      const r = 8;
      // Dithered halo
      for (let y = -r * 2; y <= r * 2; y++)
        for (let x = -r * 2; x <= r * 2; x++) {
          const dd = Math.hypot(x, y);
          if (dd <= r || dd > r * 2) continue;
          const a = (1 - (dd - r) / r) * 0.5;
          if (a > BAYER4[((cy + y) & 3) * 4 + ((cx + x) & 3)]) {
            ctx.fillStyle = "#3a3170";
            ctx.fillRect(cx + x, cy + y, 1, 1);
          }
        }
      ctx.fillStyle = MOON;
      for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++) {
          const inMoon = x * x + y * y <= r * r;
          const inShadow = (x + 4) * (x + 4) + (y - 2) * (y - 2) <= (r - 1) * (r - 1);
          if (inMoon && !inShadow) ctx.fillRect(cx + x, cy + y, 1, 1);
        }
    }

    function drawLandscape(groundY: number, t: number) {
      if (groundY < -10) return;
      const gy = Math.round(groundY);

      // Far ridge of the Western Ghats
      ctx.fillStyle = "#241d4c";
      for (let x = 0; x < W; x++) {
        const h = 30 + 9 * Math.sin(x * 0.018 + 0.7) + 5 * Math.sin(x * 0.051 + 2.1) + 2 * Math.sin(x * 0.13);
        const y = Math.round(gy - h);
        if (y < H) ctx.fillRect(x, y, 1, Math.max(0, gy - y + 1));
      }
      // Near hills
      ctx.fillStyle = "#17132f";
      const nearH = (x: number) => 13 + 6 * Math.sin(x * 0.028 + 1.9) + 3 * Math.sin(x * 0.07);
      for (let x = 0; x < W; x++) {
        const y = Math.round(gy - nearH(x));
        if (y < H) ctx.fillRect(x, y, 1, Math.max(0, H - y));
      }

      // Houses with warm windows that flick on and off over the night
      for (const hs of houses) {
        const base = Math.round(gy - nearH(hs.x + hs.w / 2)) + 2;
        const top = base - hs.h;
        ctx.fillStyle = "#1e1940";
        ctx.fillRect(hs.x, top, hs.w, hs.h);
        ctx.fillRect(hs.x + 1, top - 1, hs.w - 2, 1);
        for (let wy = top + 2; wy < base - 1; wy += 3)
          for (let wx = hs.x + 1; wx < hs.x + hs.w - 1; wx += 2) {
            if (hash(wx * 7 + wy, Math.floor(t / 300) + wx) < 0.55) continue;
            ctx.fillStyle = hash(wx, wy) > 0.35 ? AMBER : WARM;
            ctx.fillRect(wx, wy, 1, 1);
          }
      }

      // Palms
      ctx.fillStyle = "#0f0c24";
      for (const px of palms) {
        const base = Math.round(gy - nearH(px)) + 1;
        const h = 8 + Math.floor(hash(px, 41) * 6);
        const lean = (hash(px, 42) - 0.5) * 4;
        let tx = px;
        for (let j = 0; j < h; j++) {
          tx = px + Math.round(Math.sin((j / h) * 1.3) * lean);
          ctx.fillRect(tx, base - j, 1, 1);
        }
        PALM.forEach((row, ry) => [...row].forEach((ch, cx) => ch === "X" && ctx.fillRect(tx + cx - 4, base - h - 2 + ry, 1, 1)));
      }

      // Someone up late on the hill, laptop glowing
      const cx = Math.round(W * 0.74);
      const cyBase = Math.round(gy - nearH(cx + 4)) + 1;
      const flicker = reduce ? 1 : 0.85 + 0.15 * Math.sin(t * 0.07);
      for (let y = -6; y <= 4; y++)
        for (let x = -6; x <= 8; x++) {
          const dd = Math.hypot(x, y * 1.4);
          const a = (1 - dd / 8) * 0.55 * flicker;
          if (a > BAYER4[((y + 64) & 3) * 4 + ((x + 64) & 3)]) {
            ctx.fillStyle = "#2b5a63";
            ctx.fillRect(cx + 7 + x, cyBase - 4 + y, 1, 1);
          }
        }
      CODER.forEach((row, ry) =>
        [...row].forEach((ch, rx) => {
          if (ch === ".") return;
          ctx.fillStyle = ch === "S" ? MINT : "#0b0920";
          ctx.fillRect(cx + rx, cyBase - CODER.length + ry, 1, 1);
        }),
      );

      // Ground
      ctx.fillStyle = "#0f0c24";
      ctx.fillRect(0, gy, W, Math.max(0, H - gy));

      drawTrack(gy);

      // Fireflies over the hills
      if (!reduce)
        for (const f of flies) {
          const x = (f.x + Math.sin(t * 0.01 * f.sp + f.ph) * 6 + W) % W;
          const y = gy - 8 - f.y * 26 + Math.sin(t * 0.017 * f.sp + f.ph) * 3;
          if (Math.sin(t * 0.03 * f.sp + f.ph) < 0.2) continue;
          ctx.fillStyle = WARM;
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
    }

    /** Floodlit night circuit along the bottom of the hero; the #44 itself is an SVG on top. */
    function drawTrack(gy: number) {
      const top = gy - 12;

      // Floodlight poles behind the circuit
      for (const fx of [0.32, 0.58, 0.9]) {
        const px = Math.round(W * fx);
        ctx.fillStyle = "#2a2e57";
        ctx.fillRect(px, top - 30, 1, 30);
        ctx.fillStyle = "#fff7d6";
        ctx.fillRect(px - 2, top - 32, 5, 2);
      }

      // Asphalt with a dithered sheen, kerbs on the top edge, grid boxes
      for (let y = top; y < gy; y++)
        for (let x = 0; x < W; x++) {
          const th = BAYER4[(y & 3) * 4 + (x & 3)];
          ctx.fillStyle = th > 0.82 ? "#24263f" : "#1a1b30";
          ctx.fillRect(x, y, 1, 1);
        }
      for (let x = 0; x < W; x += 3) {
        ctx.fillStyle = Math.floor(x / 3) % 2 ? "#f3f1ff" : "#dc1d1d";
        ctx.fillRect(x, top - 1, 3, 1);
      }
      ctx.fillStyle = "#3a3d5c";
      for (let x = 0; x < W; x += 6) ctx.fillRect(x, top + 5, 3, 1);

      // Soft pools of light on the asphalt under each floodlight
      for (const fx of [0.32, 0.58, 0.9]) {
        const px = Math.round(W * fx);
        for (let y = top; y < gy; y++)
          for (let x = px - 22; x <= px + 22; x++) {
            const a = 1 - Math.hypot((x - px) / 22, (y - top - 4) / 7);
            if (a > 0 && a * 0.9 > BAYER4[(y & 3) * 4 + (x & 3)]) {
              ctx.fillStyle = a > 0.55 ? "#3a3a52" : "#2c2d45";
              ctx.fillRect(x, y, 1, 1);
            }
          }
      }

    }

    let raf = 0;
    let last = performance.now();
    let t = 0;

    const frame = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.67);
      last = now;
      t += dt;
      const s = window.scrollY;
      const k = s / Math.max(1, window.innerHeight);

      renderSky(1 - smooth(0, 1.4, k));
      ctx.drawImage(sky, 0, 0);

      // Stars, nudged upward slowly as you scroll
      const drift = (s / PX) * 0.04;
      for (const st of stars) {
        let a = st.b;
        if (!reduce) a *= 0.7 + 0.3 * Math.sin(t * st.sp + st.ph);
        a = Math.round(a * 4) / 4;
        if (a <= 0) continue;
        const y = Math.floor((((st.y - drift) % H) + H) % H);
        ctx.globalAlpha = a;
        ctx.fillStyle = st.col;
        ctx.fillRect(st.x, y, 1, 1);
        if (st.big && a >= 0.5) {
          ctx.globalAlpha = a * 0.45;
          ctx.fillRect(st.x - 1, y, 1, 1);
          ctx.fillRect(st.x + 1, y, 1, 1);
          ctx.fillRect(st.x, y - 1, 1, 1);
          ctx.fillRect(st.x, y + 1, 1, 1);
        }
      }
      ctx.globalAlpha = 1;

      if (!reduce && !shooter && Math.random() < 0.0025 * dt) shooter = { x: Math.random() * W * 0.6, y: Math.random() * H * 0.3, life: 0 };
      if (shooter) {
        shooter.life += dt;
        const hx = shooter.x + shooter.life * 2.4;
        const hy = shooter.y + shooter.life * 1;
        for (let i = 0; i < 10; i++) {
          ctx.globalAlpha = Math.max(0, 1 - i / 10) * Math.max(0, 1 - shooter.life / 45);
          ctx.fillStyle = i === 0 ? "#ffffff" : "#cfd8ff";
          ctx.fillRect(Math.round(hx - i * 1.2), Math.round(hy - i * 0.5), 1, 1);
        }
        ctx.globalAlpha = 1;
        if (shooter.life > 45) shooter = null;
      }

      // Top-right corner, clear of the hero card and terminal on every layout
      drawMoon(W - 26, Math.round(Math.max(H * 0.1, 28) - (s / PX) * 0.12));

      const hero = document.getElementById("top");
      if (hero) drawLandscape(hero.getBoundingClientRect().bottom / PX, t);

      raf = requestAnimationFrame(frame);
    };

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pixelated pointer-events-none fixed top-0 left-0 -z-10" />;
}
