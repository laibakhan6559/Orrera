import { describe, expect, it } from 'vitest';
import { bodies, facts, getBodyById, planets, quizQuestions } from '@/data';
import type { CelestialBody } from '@/data/types';
import {
  DEFAULT_COMPARE,
  MAX_COMPARE,
  buildComparison,
  formatEarthRatio,
  parseSelection,
  relativeSizes,
  toggleSelection,
} from '@/utils/compare';
import { factOfTheDay, filterFacts, localDateKey, randomFact } from '@/utils/facts';
import { qualityProfile, resolveQuality } from '@/utils/quality';
import { mulberry32, shuffle } from '@/utils/random';
import {
  availableCount,
  buildQuiz,
  effectiveCount,
  resultMessage,
  scoreQuiz,
} from '@/utils/quiz';
import { NOT_IN_DATASET } from '@/utils/units';

const ids = planets.map((p) => p.id);
const body = (id: string) => getBodyById(id) as CelestialBody;

describe('compare: selection', () => {
  it('reads a valid ?p= value', () => {
    expect(parseSelection('venus,saturn', ids)).toEqual(['venus', 'saturn']);
  });

  it('falls back to the default pair for missing or unusable values', () => {
    expect(parseSelection(null, ids)).toEqual(DEFAULT_COMPARE);
    expect(parseSelection('', ids)).toEqual(DEFAULT_COMPARE);
    expect(parseSelection('earth', ids)).toEqual(DEFAULT_COMPARE); // only one
    expect(parseSelection('atlantis,narnia', ids)).toEqual(DEFAULT_COMPARE);
    expect(parseSelection('sun,earth', ids)).toEqual(DEFAULT_COMPARE); // the Sun is not a planet
  });

  it('drops unknown ids, repeats and extras beyond four', () => {
    expect(parseSelection('venus,venus,pluto,mars', ids)).toEqual(['venus', 'mars']);
    expect(parseSelection('mercury,venus,earth,mars,jupiter', ids)).toHaveLength(MAX_COMPARE);
  });

  it('adds and removes within the 2 to 4 limits', () => {
    expect(toggleSelection(['earth', 'mars'], 'venus')).toEqual(['earth', 'mars', 'venus']);
    expect(toggleSelection(['earth', 'mars', 'venus'], 'mars')).toEqual(['earth', 'venus']);
    // can not go below two
    const two = ['earth', 'mars'];
    expect(toggleSelection(two, 'mars')).toBe(two);
    // can not go above four
    const four = ['mercury', 'venus', 'earth', 'mars'];
    expect(toggleSelection(four, 'jupiter')).toBe(four);
  });
});

describe('compare: table values', () => {
  const selected = [body('earth'), body('mars'), body('jupiter')];
  const rows = buildComparison(selected, 'metric', body('earth'));
  const row = (id: string) => rows.find((r) => r.id === id)!;
  const cell = (rowId: string, bodyId: string) => row(rowId).cells.find((c) => c.bodyId === bodyId)!;

  it('has one row per measurement and one cell per planet', () => {
    expect(rows).toHaveLength(11);
    for (const r of rows) expect(r.cells).toHaveLength(3);
  });

  it('keeps real units in the text', () => {
    expect(cell('diameter', 'earth').text).toBe('12,756 km');
    expect(cell('distance', 'mars').text).toBe('228 million km');
  });

  it('shows ratios against Earth with three significant digits', () => {
    expect(cell('diameter', 'earth').note).toBe('Reference');
    expect(cell('diameter', 'jupiter').note).toBe('11.2× Earth');
    expect(cell('mass', 'jupiter').note).toBe('318× Earth');
    expect(cell('mass', 'mars').note).toBe('0.108× Earth');
    expect(formatEarthRatio(1)).toBe('1× Earth');
  });

  it('marks the highest value and scales bars to it', () => {
    expect(cell('diameter', 'jupiter')).toMatchObject({ isMax: true, ratio: 1 });
    expect(cell('diameter', 'earth').isMax).toBe(false);
    expect(cell('diameter', 'earth').ratio).toBeCloseTo(12756 / 142984, 5);
    expect(cell('moons', 'jupiter').isMax).toBe(true);
  });

  it('draws no bar for temperature, and labels what the number refers to', () => {
    for (const c of row('temperature').cells) expect(c.ratio).toBeNull();
    expect(cell('temperature', 'jupiter').text).toBe('-110 °C (at 1 bar)');
    expect(cell('temperature', 'earth').text).toBe('15 °C (mean surface)');
  });

  it('marks gravity on giants as a 1-bar value', () => {
    expect(cell('gravity', 'jupiter').text).toBe('23.1 m/s² (at 1 bar)');
    expect(cell('gravity', 'earth').text).toBe('9.8 m/s²');
  });

  it('does not crown a winner when values are tied', () => {
    const tied = buildComparison([body('mercury'), body('mars')], 'metric', body('earth'));
    const gravity = tied.find((r) => r.id === 'gravity')!;
    expect(gravity.cells.every((c) => !c.isMax)).toBe(true);
  });

  it('follows the unit setting', () => {
    const imperial = buildComparison(selected, 'imperial', body('earth'));
    const diameter = imperial.find((r) => r.id === 'diameter')!.cells[0];
    expect(diameter.text).toBe('7,926 mi');
  });

  it('reports a missing value honestly instead of guessing', () => {
    const broken = structuredClone(body('mars'));
    broken.physical.gravityMs2 = null;
    const out = buildComparison([body('earth'), broken], 'metric', body('earth'));
    const mars = out.find((r) => r.id === 'gravity')!.cells[1];
    expect(mars.text).toContain(NOT_IN_DATASET);
    expect(mars.ratio).toBeNull();
    expect(mars.note).toBeUndefined();
  });

  it('shows retrograde rotation on Venus', () => {
    const out = buildComparison([body('venus'), body('earth')], 'metric', body('earth'));
    expect(out.find((r) => r.id === 'rotation')!.cells[0].text).toContain('retrograde');
  });
});

describe('compare: size chart', () => {
  it('gives the biggest planet the full size and others their true proportion', () => {
    const sizes = relativeSizes([body('earth'), body('jupiter')], 168);
    expect(sizes[1].px).toBe(168);
    expect(sizes[0].ratio).toBeCloseTo(12756 / 142984, 5);
    expect(sizes[0].px).toBeCloseTo((12756 / 142984) * 168, 5);
  });

  it('never makes a planet vanishingly small', () => {
    const sizes = relativeSizes([body('mercury'), body('jupiter')], 168);
    expect(sizes[0].px).toBe(8);
  });
});

describe('facts', () => {
  it('formats a local date key with padding', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(localDateKey(new Date(2026, 10, 15, 23, 59))).toBe('2026-11-15');
  });

  it('gives the same fact all day and varies across days', () => {
    const morning = factOfTheDay(facts, new Date(2026, 10, 15, 6, 0));
    const night = factOfTheDay(facts, new Date(2026, 10, 15, 23, 30));
    expect(morning).toBeDefined();
    expect(morning!.id).toBe(night!.id);
    expect(facts).toContain(morning);

    const seen = new Set<string>();
    for (let d = 1; d <= 60; d++) seen.add(factOfTheDay(facts, new Date(2026, 0, d))!.id);
    expect(seen.size).toBeGreaterThan(8);
  });

  it('handles an empty list', () => {
    expect(factOfTheDay([])).toBeUndefined();
    expect(randomFact([])).toBeUndefined();
  });

  it('picks a random fact that differs from the current one', () => {
    const first = facts[0];
    for (const r of [0, 0.3, 0.99, 0.9999]) {
      expect(randomFact(facts, first.id, () => r)!.id).not.toBe(first.id);
    }
    expect(randomFact([first], first.id)).toBe(first);
  });

  it('searches text, topic and related object names, ignoring case', () => {
    const venus = filterFacts(facts, { query: 'VENUS' });
    expect(venus.length).toBeGreaterThan(2);
    expect(venus.every((f) => f.relatedObjectIds.includes('venus') || /venus/i.test(f.text))).toBe(true);

    expect(filterFacts(facts, { query: 'extreme' }).length).toBeGreaterThan(0);
    expect(filterFacts(facts, { query: 'great red spot' })).toHaveLength(1);
  });

  it('requires every word to match', () => {
    expect(filterFacts(facts, { query: 'venus mercury' }).length).toBeLessThan(
      filterFacts(facts, { query: 'venus' }).length,
    );
    expect(filterFacts(facts, { query: 'venus zzzzqqq' })).toEqual([]);
  });

  it('filters by topic and combines with search', () => {
    const sunFacts = filterFacts(facts, { category: 'sun' });
    expect(sunFacts.length).toBeGreaterThan(0);
    expect(sunFacts.every((f) => f.category === 'sun')).toBe(true);
    expect(filterFacts(facts, { category: 'sun', query: 'venus' })).toEqual([]);
    expect(filterFacts(facts)).toHaveLength(facts.length);
    expect(filterFacts(facts, { query: '   ' })).toHaveLength(facts.length);
  });
});

describe('quiz building', () => {
  it('counts questions per difficulty', () => {
    const parts = (['beginner', 'intermediate', 'advanced'] as const).map((d) => availableCount(quizQuestions, d));
    expect(parts.every((n) => n > 0)).toBe(true);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(quizQuestions.length);
    expect(availableCount(quizQuestions, 'all')).toBe(quizQuestions.length);
  });

  it('limits the length to what is available', () => {
    expect(effectiveCount(20, 5)).toBe(5);
    expect(effectiveCount(4, 10)).toBe(4);
    expect(effectiveCount(4, 'all')).toBe(4);
  });

  it('builds a shuffled quiz of the right size and difficulty', () => {
    const quiz = buildQuiz(quizQuestions, { difficulty: 'beginner', length: 5 }, mulberry32(1));
    expect(quiz).toHaveLength(5);
    expect(quiz.every((q) => q.difficulty === 'beginner')).toBe(true);
    expect(new Set(quiz.map((q) => q.id)).size).toBe(5);
  });

  it('keeps the right answer tracked after shuffling the choices', () => {
    for (const seed of [1, 2, 3, 99]) {
      const quiz = buildQuiz(quizQuestions, { difficulty: 'all', length: 'all' }, mulberry32(seed));
      expect(quiz).toHaveLength(quizQuestions.length);
      for (const q of quiz) {
        const original = quizQuestions.find((o) => o.id === q.id)!;
        expect(q.choices[q.correctIndex]).toBe(original.choices[original.correctIndex]);
        expect([...q.choices].sort()).toEqual([...original.choices].sort());
      }
    }
  });

  it('is repeatable for one seed and different for another', () => {
    const ids = (seed: number) =>
      buildQuiz(quizQuestions, { difficulty: 'all', length: 'all' }, mulberry32(seed)).map((q) => q.id);
    expect(ids(7)).toEqual(ids(7));
    expect(ids(7)).not.toEqual(ids(8));
  });

  it('uses every advanced question when fewer than asked for exist', () => {
    const quiz = buildQuiz(quizQuestions, { difficulty: 'advanced', length: 10 });
    expect(quiz).toHaveLength(availableCount(quizQuestions, 'advanced'));
  });

  it('shuffle never changes its input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, mulberry32(5));
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('quiz scoring', () => {
  const quiz = buildQuiz(quizQuestions, { difficulty: 'beginner', length: 5 }, mulberry32(3));

  it('scores a perfect run', () => {
    const result = scoreQuiz(quiz, quiz.map((q) => q.correctIndex));
    expect(result).toMatchObject({ score: 5, total: 5, percent: 100 });
    expect(result.missed).toEqual([]);
  });

  it('collects wrong and skipped answers for review', () => {
    const answers: (number | null)[] = quiz.map((q) => q.correctIndex);
    answers[0] = (quiz[0].correctIndex + 1) % quiz[0].choices.length;
    answers[1] = null;
    const result = scoreQuiz(quiz, answers);
    expect(result.score).toBe(3);
    expect(result.percent).toBe(60);
    expect(result.missed.map((m) => m.question.id)).toEqual([quiz[0].id, quiz[1].id]);
    expect(result.missed[1].chosen).toBeNull();
  });

  it('handles an empty quiz', () => {
    expect(scoreQuiz([], [])).toMatchObject({ score: 0, total: 0, percent: 0 });
  });

  it('has a message for every score band', () => {
    const messages = [100, 85, 65, 45, 10].map(resultMessage);
    expect(new Set(messages).size).toBe(5);
  });
});

describe('3D quality', () => {
  it('honours an explicit choice', () => {
    expect(resolveQuality('low', 16)).toBe('low');
    expect(resolveQuality('high', 2)).toBe('high');
  });

  it('chooses automatically from the CPU core count', () => {
    expect(resolveQuality('auto', 2)).toBe('low');
    expect(resolveQuality('auto', 4)).toBe('low');
    expect(resolveQuality('auto', 8)).toBe('high');
    expect(resolveQuality('auto', 0)).toBe('high');
  });

  it('gives the light profile fewer pixels and polygons', () => {
    expect(qualityProfile('low').dpr).toBe(1);
    expect(qualityProfile('high').dpr).toEqual([1, 2]);
    expect(qualityProfile('low').sphereSegments[0]).toBeLessThan(qualityProfile('high').sphereSegments[0]);
  });
});

describe('data used by the new pages', () => {
  it('has the Sun and all planets selectable as favorites', () => {
    expect(bodies.map((b) => b.id)).toContain('sun');
    expect(planets).toHaveLength(8);
  });
});
