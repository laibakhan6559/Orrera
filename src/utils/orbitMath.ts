/**
 * Animation maths for the 3D explorer.
 *
 * IMPORTANT: this is an illustrative animation, not a simulation. Real orbital
 * periods range from 88 days to about 165 years, which would leave the outer
 * planets looking frozen. We keep the correct ORDER (inner planets are always
 * faster) but compress the ratios with a square root.
 */

export const TWO_PI = Math.PI * 2;
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Seconds for one visual orbit of the reference period at 1x speed. */
export const BASE_ORBIT_SECONDS = 14;
/** Mercury's period; used as the reference. */
export const REFERENCE_PERIOD_DAYS = 88;
/** Longest frame we will integrate, so a background tab never causes a jump. */
export const MAX_FRAME_SECONDS = 0.1;

export const degToRad = (deg: number) => (deg * Math.PI) / 180;

/** Seconds one full visual orbit takes at 1x speed. */
export function visualOrbitSeconds(periodDays: number): number {
  if (!Number.isFinite(periodDays) || periodDays <= 0) return BASE_ORBIT_SECONDS;
  return BASE_ORBIT_SECONDS * Math.sqrt(periodDays / REFERENCE_PERIOD_DAYS);
}

/** Radians per second along the orbit at 1x speed. */
export function orbitAngularSpeed(periodDays: number): number {
  return TWO_PI / visualOrbitSeconds(periodDays);
}

/** Spread starting positions around the Sun so planets never line up. */
export function startAngle(orderFromSun: number): number {
  return (orderFromSun * GOLDEN_ANGLE) % TWO_PI;
}

/** Position on a circular orbit in the x-z plane, counter-clockwise from above. */
export function orbitPosition(radius: number, angle: number): [number, number, number] {
  return [Math.cos(angle) * radius, 0, -Math.sin(angle) * radius];
}

/**
 * Visual spin speed in radians per second at 1x. Real rotation periods range
 * from 10 hours to 243 days, so they are compressed logarithmically.
 * A negative period (retrograde) spins the other way.
 */
export function spinSpeed(rotationHours: number | null | undefined): number {
  if (rotationHours == null || !Number.isFinite(rotationHours) || rotationHours === 0) return 0.4;
  const seconds = 8 + 4 * Math.log10(Math.max(Math.abs(rotationHours), 1));
  return Math.sign(rotationHours) * (TWO_PI / seconds);
}

/** Advance an angle by one frame. `timeScale` is 0 when paused. */
export function advance(
  angle: number,
  radiansPerSecond: number,
  deltaSeconds: number,
  timeScale: number,
): number {
  const dt = Math.min(Math.max(deltaSeconds, 0), MAX_FRAME_SECONDS);
  return angle + radiansPerSecond * dt * timeScale;
}

/**
 * How far the camera sits from a focused body, based on its display radius.
 * On tall (portrait) screens the view is narrower, so the camera backs off a
 * little to keep the whole body on screen.
 */
export function focusDistance(visualRadius: number, aspect = 1.6): number {
  const base = visualRadius * 5 + 2;
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1.6;
  return safeAspect < 1 ? base * Math.pow(safeAspect, -0.6) : base;
}
