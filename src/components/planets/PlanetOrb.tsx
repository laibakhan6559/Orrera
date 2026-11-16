import type { CSSProperties } from 'react';
import type { CelestialBody } from '@/data/types';

interface PlanetOrbProps {
  body: Pick<CelestialBody, 'visual' | 'objectType'>;
  /** Pixel number or any CSS length. */
  size?: number | string;
  className?: string;
}

/**
 * A procedural (texture-free) planet drawn with CSS gradients.
 * Decorative only, so it is hidden from assistive tech.
 */
export function PlanetOrb({ body, size = 96, className = '' }: PlanetOrbProps) {
  const { palette, accent, hasRings } = body.visual;
  const isStar = body.objectType === 'star';
  const dim = typeof size === 'number' ? `${size}px` : size;

  const ring: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '178%',
    height: '56%',
    borderRadius: '50%',
    border: `3px solid ${accent}`,
    boxShadow: `0 0 0 5px ${accent}33, inset 0 0 0 5px ${accent}22`,
    pointerEvents: 'none',
  };

  const orb: CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: `radial-gradient(circle at 32% 28%, ${palette[0]}, ${palette[1]} 62%, #050408 128%)`,
    boxShadow: isStar
      ? `0 0 60px 14px ${accent}66, 0 0 140px 40px ${accent}33`
      : `0 0 36px 2px ${accent}40, inset -10px -14px 22px rgb(0 0 0 / 0.5)`,
  };

  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: dim, height: dim }}
    >
      {hasRings && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotate(-18deg)',
            pointerEvents: 'none',
          }}
        >
          <span style={{ ...ring, transform: 'translate(-50%, -50%)', opacity: 0.55 }} />
        </span>
      )}
      <span className="relative z-[1] block" style={orb} />
      {hasRings && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            transform: 'rotate(-18deg)',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              ...ring,
              transform: 'translate(-50%, -50%)',
              clipPath: 'inset(50% 0 0 0)',
            }}
          />
        </span>
      )}
    </span>
  );
}
