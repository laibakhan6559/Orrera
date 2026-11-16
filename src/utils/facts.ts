import { getBodyById } from '@/data';
import type { FactCategory, SpaceFact } from '@/data/types';
import { hashString } from './random';

export const FACT_CATEGORY_LABELS: Record<FactCategory, string> = {
  sun: 'The Sun',
  planets: 'Planets',
  moons: 'Moons',
  'orbital-mechanics': 'Orbits and rotation',
  'extreme-environments': 'Extreme environments',
};

export type FactFilter = FactCategory | 'all';

/** Local calendar date as YYYY-MM-DD, so "fact of the day" changes at the visitor's midnight. */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The same fact all day, a different one tomorrow. No server needed. */
export function factOfTheDay(facts: SpaceFact[], date: Date = new Date()): SpaceFact | undefined {
  if (facts.length === 0) return undefined;
  return facts[hashString(localDateKey(date)) % facts.length];
}

/** A random fact that is not the one currently shown (when there is a choice). */
export function randomFact(
  facts: SpaceFact[],
  excludeId?: string,
  rng: () => number = Math.random,
): SpaceFact | undefined {
  if (facts.length === 0) return undefined;
  const pool = facts.length > 1 ? facts.filter((f) => f.id !== excludeId) : facts;
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

function searchText(fact: SpaceFact): string {
  const names = fact.relatedObjectIds.map((id) => getBodyById(id)?.displayName ?? '');
  return [fact.text, FACT_CATEGORY_LABELS[fact.category], ...names].join(' ').toLowerCase();
}

/** Every search word must appear in the fact text, its category, or a related object name. */
export function filterFacts(
  facts: SpaceFact[],
  { query = '', category = 'all' }: { query?: string; category?: FactFilter } = {},
): SpaceFact[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return facts.filter((fact) => {
    if (category !== 'all' && fact.category !== category) return false;
    if (words.length === 0) return true;
    const haystack = searchText(fact);
    return words.every((w) => haystack.includes(w));
  });
}
