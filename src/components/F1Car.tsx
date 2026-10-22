/**
 * The #44, drawn in vector. Two modes:
 *  - "livery": the race car, with its engineering lit (rain light, brake discs,
 *    ERS deployment, DRS), driven by data-attributes on a parent so it can be
 *    animated without re-rendering.
 *  - "xray": a technical drawing with internals; one system glows at a time.
 */

export type Zone = "cockpit" | "power" | "ers" | "telemetry";

const RED = "#dc1d1d";
const CARBON = "#15151f";
const GLOW: Record<Zone, string> = {
  cockpit: "#ffd23f",
  power: "#ff5a4f",
  ers: "#7fe0c3",
  telemetry: "#9db4ff",
};

const BODY =
  "M58 96 L70 88 C110 80 150 70 190 62 C215 56 232 46 240 36 L262 34 C270 34 274 40 276 52 L330 60 C360 64 420 74 470 86 C520 97 560 104 592 110 L594 116 C560 118 520 118 490 118 L360 120 C340 126 300 128 250 128 L120 126 C95 124 72 114 58 106 Z";
const SIDEPOD = "M200 92 C230 80 300 80 340 86 C352 96 352 112 340 120 L230 124 C210 118 198 106 200 92 Z";
const STRIPE = "M120 84 C160 74 200 64 236 50 L238 56 C202 70 162 80 122 90 Z";
const MAIN_PLANE = "M14 30 C40 22 80 22 100 28 L98 34 C78 30 40 30 16 36 Z";
const DRS_FLAP = "M16 16 C40 10 76 10 96 16 L94 22 C74 18 40 18 18 24 Z";
const ENDPLATE = "M18 14 L44 14 L50 100 L28 104 Z";
const FRONT_WING_MAIN = "M468 128 C520 124 570 124 598 128 L598 133 L468 135 Z";
const FRONT_WING_FLAP = "M486 120 C530 116 572 118 594 122 L594 125 C570 122 530 121 486 124 Z";

function Wheel({ cx, xray, lit }: { cx: number; xray: boolean; lit: boolean }) {
  const stroke = xray ? (lit ? GLOW.telemetry : "#9db4ff") : "none";
  return (
    <g>
      <circle cx={cx} cy={110} r={34} fill={xray ? (lit ? "#1d2350" : "#151834") : "#0d0d14"} stroke={stroke} strokeWidth={xray ? 1.2 : 0} />
      {/* compound ring: yellow = medium */}
      <circle cx={cx} cy={110} r={28} fill="none" stroke={xray && !lit ? "#3a3f78" : "#ffd23f"} strokeWidth={2} opacity={xray && !lit ? 0.6 : 0.9} />
      <circle cx={cx} cy={110} r={22} fill={xray ? "none" : "#1e1f2e"} stroke={xray ? stroke : "none"} strokeWidth={0.8} />
      {/* brake disc, glows when hot */}
      <circle className="brake-glow" cx={cx} cy={110} r={17} fill="url(#brakeHeat)" />
      <g className="wheel-spin">
        {[0, 72, 144, 216, 288].map((a) => (
          <line
            key={a}
            x1={cx}
            y1={110 - 5}
            x2={cx}
            y2={110 - 20}
            stroke={xray ? stroke : "#4a4d70"}
            strokeWidth={xray ? 1 : 3.5}
            strokeLinecap="round"
            transform={`rotate(${a} ${cx} 110)`}
          />
        ))}
      </g>
      <circle cx={cx} cy={110} r={5} fill={xray ? "none" : "#8a8db8"} stroke={xray ? stroke : "none"} />
    </g>
  );
}

export function CarSide({ mode = "livery", zone = null, className = "", title }: { mode?: "livery" | "xray"; zone?: Zone | null; className?: string; title?: string }) {
  const xray = mode === "xray";
  const on = (z: Zone) => xray && zone === z;
  const dim = (z: Zone) => (xray && zone !== z ? 0.35 : 1);
  const line = (z: Zone) => (on(z) ? GLOW[z] : "#9db4ff");
  const glow = (z: Zone) => (on(z) ? { filter: `drop-shadow(0 0 4px ${GLOW[z]}) drop-shadow(0 0 10px ${GLOW[z]})` } : undefined);

  return (
    <svg viewBox="0 0 600 150" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <radialGradient id="brakeHeat">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="55%" stopColor="#ff7a2a" />
          <stop offset="100%" stopColor="#ff3d00" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="podShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ec2a2e" />
          <stop offset="100%" stopColor="#9e0f14" />
        </linearGradient>
        <linearGradient id="bodyShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0302f" />
          <stop offset="60%" stopColor={RED} />
          <stop offset="100%" stopColor="#a8131a" />
        </linearGradient>
      </defs>

      {!xray && <ellipse cx={300} cy={146} rx={272} ry={5} fill="#000" opacity={0.4} />}

      {/* Rear wing: endplate, main plane, DRS flap (ERS + DRS system) */}
      <g opacity={dim("ers")} style={glow("ers")}>
        <path d={ENDPLATE} fill={xray ? "none" : CARBON} stroke={xray ? line("ers") : "none"} strokeWidth={1} />
        <rect x={60} y={30} width={6} height={58} fill={xray ? "none" : CARBON} stroke={xray ? line("ers") : "none"} strokeWidth={1} />
        <path d={MAIN_PLANE} fill={xray ? (on("ers") ? "#1b3a3a" : "none") : RED} stroke={xray ? line("ers") : "none"} strokeWidth={1} />
        <path className="drs-flap" d={DRS_FLAP} fill={xray ? (on("ers") ? "#1b3a3a" : "none") : RED} stroke={xray ? line("ers") : "none"} strokeWidth={1} />
      </g>
      {/* rain light */}
      <rect className="rain-light" x={52} y={88} width={6} height={9} rx={1} fill="#ff3344" />

      {/* Floor */}
      <path d="M84 128 L520 128 L528 134 L80 136 Z" fill={xray ? "none" : CARBON} stroke={xray ? "#9db4ff" : "none"} strokeWidth={1} opacity={xray ? 0.35 : 1} />

      {/* Helmet sits behind the cockpit rim */}
      <g opacity={dim("cockpit")} style={glow("cockpit")}>
        <circle cx={292} cy={52} r={12} fill={xray && !on("cockpit") ? "none" : "#ffd23f"} stroke={xray ? line("cockpit") : "none"} />
        <path d="M296 46 L306 47 L305 54 L295 53 Z" fill={xray && !on("cockpit") ? "none" : "#1a1a2e"} stroke={xray ? line("cockpit") : "none"} strokeWidth={0.8} />
      </g>

      {/* Body */}
      <path d={BODY} fill={xray ? "#151834" : "url(#bodyShade)"} fillOpacity={xray ? 0.55 : 1} stroke={xray ? "#9db4ff" : "none"} strokeWidth={1.2} />
      <path d={SIDEPOD} fill={xray ? "none" : "url(#podShade)"} stroke={xray ? "#9db4ff" : "none"} strokeWidth={0.8} opacity={xray ? 0.6 : 1} />
      {!xray && (
        <>
          <path d={STRIPE} fill="#f3f1ff" />
          <path d="M332 88 C344 90 348 100 344 110 L336 110 C338 100 336 94 330 90 Z" fill="#111" />
          <rect x={256} y={36} width={8} height={12} rx={2} fill="#111" />
          <text x={258} y={113} fill="#f3f1ff" fontSize={24} fontWeight={800} fontStyle="italic" fontFamily="Geist, system-ui, sans-serif">
            44
          </text>
          {/* mirror */}
          <path d="M338 62 L344 56 L356 56 L356 61 Z" fill={RED} />
        </>
      )}

      {/* ERS deployment strip along the floor edge */}
      {!xray && <path className="ers-glow" d="M212 123 L338 121" stroke="#7fe0c3" strokeWidth={3} strokeLinecap="round" />}

      {/* X-ray internals */}
      {xray && (
        <>
          {/* V6 power unit + turbo + exhaust */}
          <g opacity={dim("power")} style={glow("power")}>
            <rect x={146} y={76} width={84} height={38} rx={4} fill={on("power") ? "#3a1a22" : "none"} stroke={line("power")} strokeWidth={1.2} />
            {[0, 1, 2].map((i) => (
              <rect key={i} x={154 + i * 24} y={82} width={18} height={12} rx={2} fill="none" stroke={line("power")} strokeWidth={0.9} />
            ))}
            <circle cx={238} cy={98} r={9} fill={on("power") ? "#3a1a22" : "none"} stroke={line("power")} strokeWidth={1.2} />
            <path d="M146 92 L104 88" stroke={line("power")} strokeWidth={2} />
          </g>
          {/* Battery (energy store) + MGU-K with energy flow */}
          <g opacity={dim("ers")} style={glow("ers")}>
            <rect x={252} y={104} width={72} height={14} rx={2} fill={on("ers") ? "#163b37" : "none"} stroke={line("ers")} strokeWidth={1.2} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={i} x1={262 + i * 10} y1={106} x2={262 + i * 10} y2={116} stroke={line("ers")} strokeWidth={0.7} />
            ))}
            <circle cx={226} cy={120} r={7} fill={on("ers") ? "#163b37" : "none"} stroke={line("ers")} strokeWidth={1.2} />
            <path className={on("ers") ? "energy-flow" : ""} d="M252 112 C242 114 236 116 233 118" stroke={line("ers")} strokeWidth={1.6} fill="none" strokeDasharray="4 3" />
          </g>
          {/* Cockpit: halo + steering wheel */}
          <g opacity={dim("cockpit")} style={glow("cockpit")}>
            <path d="M270 40 C290 30 316 34 330 52 L336 60" stroke={line("cockpit")} strokeWidth={2.4} fill="none" />
            <rect x={314} y={60} width={6} height={14} rx={2} fill={on("cockpit") ? "#4a3d12" : "none"} stroke={line("cockpit")} strokeWidth={1} />
          </g>
          {/* Telemetry: pitot + sensor points */}
          <g opacity={dim("telemetry")} style={glow("telemetry")}>
            <path d="M592 110 L600 104" stroke={line("telemetry")} strokeWidth={1.5} />
            {[
              [560, 108],
              [420, 82],
              [300, 124],
              [180, 70],
            ].map(([x, y]) => (
              <circle key={`${x}`} cx={x} cy={y} r={2.2} fill={line("telemetry")} className={on("telemetry") ? "sensor-ping" : ""} />
            ))}
          </g>
        </>
      )}

      {!xray && (
        <>
          {/* Halo over the helmet */}
          <path d="M270 40 C290 30 316 34 330 52 L336 60" stroke={CARBON} strokeWidth={5} fill="none" strokeLinecap="round" />
          {/* Suspension */}
          <path d="M478 110 L430 90 M478 110 L440 114 M112 110 L160 96 M112 110 L152 118" stroke={CARBON} strokeWidth={3} />
        </>
      )}

      {/* Front wing (telemetry/aero) */}
      <g opacity={dim("telemetry")} style={glow("telemetry")}>
        <path d={FRONT_WING_MAIN} fill={xray ? "none" : RED} stroke={xray ? line("telemetry") : "none"} strokeWidth={1} />
        <path d={FRONT_WING_FLAP} fill={xray ? "none" : CARBON} stroke={xray ? line("telemetry") : "none"} strokeWidth={1} />
        <rect x={586} y={112} width={12} height={24} fill={xray ? "none" : CARBON} stroke={xray ? line("telemetry") : "none"} strokeWidth={1} />
      </g>

      {/* Wheels sit outboard, so they go last */}
      <g opacity={dim("telemetry")} style={glow("telemetry")}>
        <Wheel cx={112} xray={xray} lit={on("telemetry")} />
        <Wheel cx={478} xray={xray} lit={on("telemetry")} />
      </g>
    </svg>
  );
}

/** Top-down view, nose pointing down the page. */
export function CarTop({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 100" className={className} aria-hidden="true">
      <rect x={4} y={92} width={32} height={6} rx={1} fill={RED} />
      <rect x={18} y={60} width={4} height={34} fill={RED} />
      <rect x={0} y={74} width={9} height={14} rx={2} fill="#0d0d14" />
      <rect x={31} y={74} width={9} height={14} rx={2} fill="#0d0d14" />
      <path d="M12 20 L28 20 L30 46 L26 64 L14 64 L10 46 Z" fill={RED} />
      <path d="M8 26 L12 22 L12 46 L8 44 Z M32 26 L28 22 L28 46 L32 44 Z" fill="#a8131a" />
      <circle cx={20} cy={46} r={3.6} fill="#ffd23f" />
      <path d="M14 42 C16 52 24 52 26 42" stroke={CARBON} strokeWidth={1.6} fill="none" />
      <rect x={0} y={10} width={10} height={16} rx={2} fill="#0d0d14" />
      <rect x={30} y={10} width={10} height={16} rx={2} fill="#0d0d14" />
      <rect x={4} y={2} width={32} height={6} rx={1} fill={CARBON} />
      <rect x={6} y={6} width={28} height={3} fill={RED} />
      <rect className="rain-light" x={18} y={0} width={4} height={2} fill="#ff3344" />
    </svg>
  );
}
