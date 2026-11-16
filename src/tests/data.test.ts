import { describe, expect, it } from 'vitest';
import {
  bodies,
  facts,
  getBodyById,
  getBodyBySlug,
  getFactsForObject,
  getNeighbours,
  planets,
  quizQuestions,
  sun,
} from '@/data';
import type { CelestialBody } from '@/data';
import {
  isIsoDate,
  validateBodies,
  validateFacts,
  validateQuiz,
} from '@/utils/dataValidation';
import { NOT_IN_DATASET } from '@/utils/units';
import { buildStatRows } from '@/utils/stats';

const ids = new Set(bodies.map((b) => b.id));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

describe('bundled datasets', () => {
  it('bodies validate with no issues', () => {
    expect(validateBodies(bodies)).toEqual([]);
  });

  it('facts validate with no issues', () => {
    expect(validateFacts(facts, ids)).toEqual([]);
  });

  it('quiz questions validate with no issues', () => {
    expect(validateQuiz(quizQuestions, ids)).toEqual([]);
  });

  it('contains the Sun and eight planets in order', () => {
    expect(sun.displayName).toBe('Sun');
    expect(planets.map((p) => p.displayName)).toEqual([
      'Mercury',
      'Venus',
      'Earth',
      'Mars',
      'Jupiter',
      'Saturn',
      'Uranus',
      'Neptune',
    ]);
  });

  it('has enough facts and quiz questions across difficulty levels', () => {
    expect(facts.length).toBeGreaterThanOrEqual(20);
    expect(quizQuestions.length).toBeGreaterThanOrEqual(15);
    for (const level of ['beginner', 'intermediate', 'advanced']) {
      expect(quizQuestions.some((q) => q.difficulty === level)).toBe(true);
    }
  });

  it('keeps scientific values separate from display values', () => {
    for (const p of planets) {
      expect(p.visual.visualOrbitRadius).not.toBeNull();
      // Display radius is never the real diameter.
      expect(p.visual.visualRadius).toBeLessThan(100);
    }
  });

  it('gives only Saturn visual rings', () => {
    expect(bodies.filter((b) => b.visual.hasRings).map((b) => b.id)).toEqual(['saturn']);
  });

  it('every record carries source and review metadata', () => {
    for (const b of bodies) {
      expect(b.sources.length).toBeGreaterThan(0);
      expect(isIsoDate(b.lastReviewed)).toBe(true);
    }
  });
});

describe('lookup helpers', () => {
  it('finds bodies by id and slug', () => {
    expect(getBodyById('earth')?.displayName).toBe('Earth');
    expect(getBodyBySlug('neptune')?.orderFromSun).toBe(8);
    expect(getBodyBySlug('not-a-planet')).toBeUndefined();
    expect(getBodyBySlug(undefined)).toBeUndefined();
  });

  it('walks outward from the Sun', () => {
    expect(getNeighbours(sun)).toEqual({ previous: null, next: planets[0] });
    expect(getNeighbours(planets[3]).previous?.id).toBe('earth');
    expect(getNeighbours(planets[3]).next?.id).toBe('jupiter');
    expect(getNeighbours(planets[7]).next).toBeNull();
  });

  it('links facts to objects', () => {
    expect(getFactsForObject('venus').length).toBeGreaterThan(0);
  });
});

describe('validator catches bad data', () => {
  it('flags duplicate ids and slugs', () => {
    const bad = clone(bodies);
    bad[2].id = bad[1].id;
    bad[2].slug = bad[1].slug;
    const messages = validateBodies(bad).map((i) => i.message);
    expect(messages).toContain('Duplicate id.');
    expect(messages).toContain('Duplicate slug.');
  });

  it('flags missing sources and bad dates', () => {
    const bad = clone(bodies);
    bad[1].sources = [];
    bad[1].lastReviewed = '12/11/2026';
    const paths = validateBodies(bad).map((i) => i.path);
    expect(paths).toContain('bodies.mercury.sources');
    expect(paths).toContain('bodies.mercury.lastReviewed');
  });

  it('flags a surface temperature on a gas giant', () => {
    const bad = clone(bodies);
    const jupiter = bad.find((b) => b.id === 'jupiter') as CelestialBody;
    jupiter.physical.temperature.basis = 'surface-mean';
    expect(validateBodies(bad).some((i) => i.path.includes('jupiter'))).toBe(true);
  });

  it('flags impossible values', () => {
    const bad = clone(bodies);
    bad[3].physical.massKg = -5;
    bad[3].orbit!.eccentricity = 1.2;
    const paths = validateBodies(bad).map((i) => i.path);
    expect(paths).toContain('bodies.earth.physical.massKg');
    expect(paths).toContain('bodies.earth.orbit.eccentricity');
  });

  it('flags broken references in facts and quiz', () => {
    const f = clone(facts);
    f[0].relatedObjectIds = ['atlantis'];
    expect(validateFacts(f, ids).length).toBeGreaterThan(0);

    const q = clone(quizQuestions);
    q[0].correctIndex = 9;
    expect(validateQuiz(q, ids).some((i) => i.path.endsWith('correctIndex'))).toBe(true);
  });
});

describe('buildStatRows', () => {
  it('formats Earth with units', () => {
    const earth = getBodyById('earth') as CelestialBody;
    const { physical, motion } = buildStatRows(earth, 'metric');
    expect(physical.find((r) => r.id === 'diameter')?.value).toBe('12,756 km');
    expect(physical.find((r) => r.id === 'mass')?.value).toBe('5.97 × 10²⁴ kg');
    expect(motion.find((r) => r.id === 'distance')?.value).toBe('149.6 million km');
  });

  it('switches to imperial units', () => {
    const earth = getBodyById('earth') as CelestialBody;
    const { physical } = buildStatRows(earth, 'imperial');
    expect(physical.find((r) => r.id === 'diameter')?.value).toBe('7,926 mi');
    expect(physical.find((r) => r.id === 'temperature')?.value).toBe('59 °F');
  });

  it('labels giant temperatures as 1-bar values, not surface values', () => {
    const jupiter = getBodyById('jupiter') as CelestialBody;
    const temp = buildStatRows(jupiter).physical.find((r) => r.id === 'temperature');
    expect(temp?.label).toBe('Temperature at 1 bar');
  });

  it('marks retrograde rotation on Venus', () => {
    const venus = getBodyById('venus') as CelestialBody;
    const rot = buildStatRows(venus).motion.find((r) => r.id === 'rotation');
    expect(rot?.value).toContain('retrograde');
  });

  it('has no orbit rows for the Sun and shows missing values honestly', () => {
    const { motion } = buildStatRows(sun);
    expect(motion.find((r) => r.id === 'distance')).toBeUndefined();
    expect(motion.find((r) => r.id === 'solar-day')?.value).toBe(NOT_IN_DATASET);
  });
});
