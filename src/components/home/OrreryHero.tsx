import { planets, sun } from '@/data';

/** Illustrative spin durations in seconds (not real orbital periods). */
const SPIN_SECONDS = [14, 20, 28, 36, 58, 78, 102, 132];
const START_ANGLES = [20, 140, 255, 60, 310, 190, 95, 330];
const RING_RADII = [52, 82, 112, 140, 178, 214, 250, 284];
const BODY_RADII = [4, 6, 6.5, 5, 13, 11, 8, 8];
const CX = 300;
const CY = 300;

const ticks = Array.from({ length: 72 }, (_, i) => i);

/**
 * Lightweight, pure-SVG animated orrery for the home page hero.
 * It is a decorative preview, so the full 3D scene is not needed here.
 */
export function OrreryHero() {
  return (
    <svg
      viewBox="0 0 600 600"
      role="img"
      aria-label="Decorative brass orrery showing the Sun and eight planets on their orbits. Not to scale."
      className="h-auto w-full"
    >
      <defs>
        <radialGradient id="orrera-sun" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor={sun.visual.palette[0]} />
          <stop offset="100%" stopColor={sun.visual.palette[1]} />
        </radialGradient>
        <radialGradient id="orrera-sun-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={sun.visual.accent} stopOpacity="0.55" />
          <stop offset="100%" stopColor={sun.visual.accent} stopOpacity="0" />
        </radialGradient>
        {planets.map((p) => (
          <radialGradient key={p.id} id={`orrera-${p.id}`} cx="32%" cy="28%" r="80%">
            <stop offset="0%" stopColor={p.visual.palette[0]} />
            <stop offset="100%" stopColor={p.visual.palette[1]} />
          </radialGradient>
        ))}
      </defs>

      {/* Outer dial with degree ticks */}
      <circle cx={CX} cy={CY} r={296} fill="none" stroke="#8f6b30" strokeOpacity="0.55" strokeWidth="1" />
      <g stroke="#d6a95b">
        {ticks.map((i) => {
          const a = (i * 5 * Math.PI) / 180;
          const major = i % 6 === 0;
          const r1 = 296;
          const r2 = major ? 286 : 291;
          return (
            <line
              key={i}
              x1={CX + Math.cos(a) * r1}
              y1={CY + Math.sin(a) * r1}
              x2={CX + Math.cos(a) * r2}
              y2={CY + Math.sin(a) * r2}
              strokeOpacity={major ? 0.7 : 0.3}
              strokeWidth={major ? 1.4 : 1}
            />
          );
        })}
      </g>

      {/* Cross-hair axes */}
      <g stroke="#d6a95b" strokeOpacity="0.14" strokeWidth="1">
        <line x1={CX} y1={14} x2={CX} y2={586} />
        <line x1={14} y1={CY} x2={586} y2={CY} />
      </g>

      {/* Orbit rings */}
      {RING_RADII.map((r, i) => (
        <circle
          key={r}
          cx={CX}
          cy={CY}
          r={r}
          fill="none"
          stroke="#d6a95b"
          strokeOpacity={0.28}
          strokeWidth="1"
          strokeDasharray={i % 2 === 0 ? undefined : '2 5'}
        />
      ))}

      {/* Sun */}
      <circle cx={CX} cy={CY} r={58} fill="url(#orrera-sun-glow)" className="pulse-glow" />
      <circle cx={CX} cy={CY} r={22} fill="url(#orrera-sun)" />

      {/* Planets */}
      {planets.map((p, i) => (
        <g key={p.id} transform={`rotate(${START_ANGLES[i]} ${CX} ${CY})`}>
          <g className="orbit-spin" style={{ animationDuration: `${SPIN_SECONDS[i]}s` }}>
            <circle
              cx={CX + RING_RADII[i]}
              cy={CY}
              r={BODY_RADII[i]}
              fill={`url(#orrera-${p.id})`}
              stroke={p.visual.accent}
              strokeOpacity="0.6"
              strokeWidth="0.8"
            />
            {p.visual.hasRings && (
              <ellipse
                cx={CX + RING_RADII[i]}
                cy={CY}
                rx={BODY_RADII[i] * 1.9}
                ry={BODY_RADII[i] * 0.55}
                fill="none"
                stroke={p.visual.accent}
                strokeOpacity="0.85"
                strokeWidth="1.6"
                transform={`rotate(-18 ${CX + RING_RADII[i]} ${CY})`}
              />
            )}
          </g>
        </g>
      ))}
    </svg>
  );
}
