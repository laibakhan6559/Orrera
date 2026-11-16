import bodiesJson from './bodies.json';
import factsJson from './facts.json';
import quizJson from './quiz.json';
import type { CelestialBody, QuizQuestion, SpaceFact } from './types';

// The JSON files are checked against these types by src/utils/dataValidation.ts
// (see the data tests), so the casts below are safe.
export const bodies = bodiesJson as unknown as CelestialBody[];
export const facts = factsJson as unknown as SpaceFact[];
export const quizQuestions = quizJson as unknown as QuizQuestion[];

export const sun = bodies.find((b) => b.id === 'sun') as CelestialBody;

export const planets = bodies
  .filter((b) => b.objectType === 'planet')
  .sort((a, b) => a.orderFromSun - b.orderFromSun);

export function getBodyById(id: string | undefined): CelestialBody | undefined {
  return bodies.find((b) => b.id === id);
}

export function getBodyBySlug(slug: string | undefined): CelestialBody | undefined {
  return bodies.find((b) => b.slug === slug);
}

/** Previous and next object going outward from the Sun (Sun, Mercury ... Neptune). */
export function getNeighbours(body: CelestialBody): {
  previous: CelestialBody | null;
  next: CelestialBody | null;
} {
  const ordered = [sun, ...planets];
  const index = ordered.findIndex((b) => b.id === body.id);
  return {
    previous: index > 0 ? ordered[index - 1] : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}

export function getFactsForObject(id: string): SpaceFact[] {
  return facts.filter((f) => f.relatedObjectIds.includes(id));
}

export * from './types';
