import { describe, expect, it } from 'vitest';
import { planets } from '@/data';
import {
  BASE_ORBIT_SECONDS,
  MAX_FRAME_SECONDS,
  TWO_PI,
  advance,
  degToRad,
  focusDistance,
  orbitAngularSpeed,
  orbitPosition,
  spinSpeed,
  startAngle,
  visualOrbitSeconds,
} from '@/utils/orbitMath';
import { defaultCameraPosition } from '@/components/explorer/cameraConstants';

describe('visual orbit timing', () => {
  it('uses the base duration for Mercury and falls back safely for bad input', () => {
    expect(visualOrbitSeconds(88)).toBeCloseTo(BASE_ORBIT_SECONDS, 10);
    expect(visualOrbitSeconds(0)).toBe(BASE_ORBIT_SECONDS);
    expect(visualOrbitSeconds(-5)).toBe(BASE_ORBIT_SECONDS);
    expect(visualOrbitSeconds(Number.NaN)).toBe(BASE_ORBIT_SECONDS);
  });

  it('keeps real ordering: planets further out always take longer', () => {
    const seconds = planets.map((p) => visualOrbitSeconds(p.orbit!.orbitalPeriodDays));
    for (let i = 1; i < seconds.length; i++) {
      expect(seconds[i]).toBeGreaterThan(seconds[i - 1]);
    }
  });

  it('compresses the ratio so Neptune still visibly moves', () => {
    const neptune = planets[7].orbit!.orbitalPeriodDays;
    // Real ratio is ~680x Mercury; the visual ratio must be far smaller.
    expect(visualOrbitSeconds(neptune) / visualOrbitSeconds(88)).toBeLessThan(40);
    expect(visualOrbitSeconds(neptune)).toBeLessThan(600);
  });

  it('completes one full revolution in the stated time', () => {
    const period = planets[2].orbit!.orbitalPeriodDays; // Earth
    const step = 0.05;
    const steps = Math.round(visualOrbitSeconds(period) / step);
    let angle = 0;
    for (let i = 0; i < steps; i++) angle = advance(angle, orbitAngularSpeed(period), step, 1);
    expect(angle).toBeCloseTo(TWO_PI, 1);
  });
});

describe('start angles and positions', () => {
  it('gives every planet its own start angle in [0, 2pi)', () => {
    const angles = planets.map((p) => startAngle(p.orderFromSun));
    expect(new Set(angles.map((a) => a.toFixed(6))).size).toBe(planets.length);
    for (const a of angles) {
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(TWO_PI);
    }
  });

  it('keeps a planet exactly on its orbit circle at any angle', () => {
    for (const angle of [0, 0.7, 2.1, 4, 6]) {
      const [x, y, z] = orbitPosition(42, angle);
      expect(Math.hypot(x, z)).toBeCloseTo(42, 8);
      expect(y).toBe(0);
    }
    expect(orbitPosition(10, 0)).toEqual([10, 0, -0]);
  });
});

describe('spinSpeed', () => {
  it('spins retrograde bodies the opposite way', () => {
    expect(spinSpeed(-5832.5)).toBeLessThan(0);
    expect(spinSpeed(-17.2)).toBeLessThan(0);
    expect(spinSpeed(23.9)).toBeGreaterThan(0);
  });

  it('uses a gentle default when rotation is unknown', () => {
    expect(spinSpeed(null)).toBeGreaterThan(0);
    expect(spinSpeed(undefined)).toBeGreaterThan(0);
    expect(spinSpeed(0)).toBeGreaterThan(0);
  });

  it('keeps every planet spin between about 7 and 25 seconds per turn', () => {
    for (const p of planets) {
      const secondsPerTurn = TWO_PI / Math.abs(spinSpeed(p.rotation!.siderealPeriodHours));
      expect(secondsPerTurn).toBeGreaterThan(7);
      expect(secondsPerTurn).toBeLessThan(25);
    }
  });
});

describe('advance', () => {
  it('does not move when paused (time scale 0)', () => {
    expect(advance(1.5, 2, 0.016, 0)).toBe(1.5);
  });

  it('scales with speed', () => {
    const normal = advance(0, 1, 0.05, 1);
    expect(advance(0, 1, 0.05, 5)).toBeCloseTo(normal * 5, 10);
  });

  it('caps long frames so a background tab causes no jump', () => {
    expect(advance(0, 1, 30, 1)).toBeCloseTo(MAX_FRAME_SECONDS, 10);
    expect(advance(0, 1, -1, 1)).toBe(0);
  });
});

describe('camera helpers', () => {
  it('backs further off for bigger bodies and for portrait screens', () => {
    expect(focusDistance(2.6)).toBeGreaterThan(focusDistance(1));
    expect(focusDistance(1, 0.46)).toBeGreaterThan(focusDistance(1, 1.6));
    expect(focusDistance(1, Number.NaN)).toBe(focusDistance(1, 1.6));
  });

  it('puts the overview camera further back on tall screens, within limits', () => {
    const wide = defaultCameraPosition(1.8).length();
    const tall = defaultCameraPosition(0.46).length();
    expect(tall).toBeGreaterThan(wide);
    expect(tall).toBeLessThanOrEqual(300.001);
    expect(defaultCameraPosition(Number.NaN).length()).toBeCloseTo(wide, 6);
  });

  it('converts degrees to radians', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 10);
    expect(degToRad(97.8)).toBeCloseTo(1.7069, 3);
  });
});
