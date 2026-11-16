import { moon } from '@/data/moon';
import { planets, sun } from '@/data';
import type { CelestialBody } from '@/data/types';

/** Everything the 360 degree viewer can show, in order: Sun, planets, then the Moon. */
export const globeBodies: CelestialBody[] = [sun, ...planets, moon];

export function findGlobeBody(slug: string | null | undefined): CelestialBody {
  return globeBodies.find((b) => b.slug === slug) ?? globeBodies[3]; // Earth by default
}

export const MIN_ZOOM = 1.35;
export const MAX_ZOOM = 12;

/** How far (in body radii) the camera starts, leaving room for Saturn's rings. */
export function startDistance(hasRings: boolean, aspect = 1.6): number {
  const base = hasRings ? 6.4 : 3.6;
  // On a tall, narrow screen the width is the limit, so pull back to keep the whole body (and rings) in view.
  return aspect < 1 ? base * Math.min(1.9, 1 / Math.max(aspect, 0.5) * 0.95 + 0.3) : base;
}

export const clampDistance = (d: number, min = MIN_ZOOM, max = MAX_ZOOM) => Math.min(max, Math.max(min, d));

/** Seconds one full turn takes in the viewer. Real periods are shown in text, not animated. */
export const VIEW_SPIN_SECONDS = 24;

/** Plain-English real rotation period, e.g. "23.9 hours" or "243 days". */
export function describeRotation(hours: number | null | undefined): string {
  if (hours == null || !Number.isFinite(hours) || hours === 0) return 'Not in this dataset';
  const h = Math.abs(hours);
  const text = h >= 48 ? `${Math.round(h / 24).toLocaleString('en-US')} days` : `${h.toLocaleString('en-US', { maximumFractionDigits: 1 })} hours`;
  return hours < 0 ? `${text} (spins backwards)` : text;
}
