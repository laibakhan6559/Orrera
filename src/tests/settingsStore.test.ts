import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  STORAGE_KEY,
  isBetterResult,
  sanitizeSettings,
  useSettingsStore,
} from '@/store/settingsStore';

const initial = useSettingsStore.getState();
beforeEach(() => {
  useSettingsStore.setState(initial, true);
  window.localStorage.clear();
});

const saved = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');

describe('defaults and persistence', () => {
  it('starts with sensible defaults', () => {
    const s = useSettingsStore.getState();
    expect(s.units).toBe('metric');
    expect(s.motion).toBe('system');
    expect(s.quality).toBe('auto');
    expect(s.favorites).toEqual([]);
    expect(s.quizBest).toEqual({});
  });

  it('saves changes to localStorage (data only, no functions)', () => {
    useSettingsStore.getState().setUnits('imperial');
    useSettingsStore.getState().toggleFavorite('earth');
    const stored = saved();
    expect(stored.state.units).toBe('imperial');
    expect(stored.state.favorites).toEqual(['earth']);
    expect(Object.keys(stored.state).sort()).toEqual(['favorites', 'motion', 'quality', 'quizBest', 'units']);
    expect(stored.version).toBe(1);
  });

  it('loads saved values and discards anything invalid', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: { units: 'klingon', motion: 'reduced', quality: 'ultra', favorites: ['earth', 'zzz', 5], quizBest: {} },
      }),
    );
    await useSettingsStore.persist.rehydrate();
    const s = useSettingsStore.getState();
    expect(s.units).toBe('metric');
    expect(s.motion).toBe('reduced');
    expect(s.quality).toBe('auto');
    expect(s.favorites).toEqual(['earth']);
  });

  it('keeps working when the browser refuses to save', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(() => useSettingsStore.getState().setUnits('imperial')).not.toThrow();
    expect(useSettingsStore.getState().units).toBe('imperial');
    spy.mockRestore();
  });
});

describe('sanitizeSettings', () => {
  it('turns any garbage into defaults', () => {
    for (const bad of [null, undefined, 'text', 42, [], {}]) {
      expect(sanitizeSettings(bad)).toEqual({
        units: 'metric',
        motion: 'system',
        quality: 'auto',
        favorites: [],
        quizBest: {},
      });
    }
  });

  it('removes unknown and duplicate favorites', () => {
    expect(sanitizeSettings({ favorites: ['mars', 'mars', 'pluto', 'sun'] }).favorites).toEqual(['mars', 'sun']);
    expect(sanitizeSettings({ favorites: 'mars' }).favorites).toEqual([]);
  });

  it('keeps only valid quiz scores', () => {
    const out = sanitizeSettings({
      quizBest: {
        all: { score: 7, total: 10, date: '2026-11-12' },
        beginner: { score: 11, total: 10, date: '2026-11-12' }, // score above total
        intermediate: { score: 3, total: 0, date: '2026-11-12' }, // empty quiz
        advanced: { score: 2, total: 4, date: 'yesterday' }, // bad date
        bogus: { score: 1, total: 1, date: '2026-11-12' }, // unknown key
      },
    });
    expect(out.quizBest).toEqual({ all: { score: 7, total: 10, date: '2026-11-12' } });
  });
});

describe('favorites', () => {
  it('toggles known bodies on and off, in order', () => {
    const { toggleFavorite } = useSettingsStore.getState();
    toggleFavorite('mars');
    toggleFavorite('earth');
    expect(useSettingsStore.getState().favorites).toEqual(['mars', 'earth']);
    toggleFavorite('mars');
    expect(useSettingsStore.getState().favorites).toEqual(['earth']);
  });

  it('ignores ids that are not in the catalogue', () => {
    useSettingsStore.getState().toggleFavorite('pluto');
    expect(useSettingsStore.getState().favorites).toEqual([]);
  });

  it('clears all favorites', () => {
    useSettingsStore.getState().toggleFavorite('mars');
    useSettingsStore.getState().clearFavorites();
    expect(useSettingsStore.getState().favorites).toEqual([]);
  });
});

describe('quiz best scores', () => {
  it('compares by percentage, then by length', () => {
    const prev = { score: 7, total: 10, date: '2026-01-01' };
    expect(isBetterResult(undefined, { score: 0, total: 5 })).toBe(true);
    expect(isBetterResult(prev, { score: 4, total: 5 })).toBe(true); // 80% beats 70%
    expect(isBetterResult(prev, { score: 6, total: 10 })).toBe(false);
    expect(isBetterResult(prev, { score: 7, total: 10 })).toBe(false); // tie
    expect(isBetterResult(prev, { score: 14, total: 20 })).toBe(true); // same % on a longer quiz
  });

  it('records a better score and reports it', () => {
    const { recordQuiz } = useSettingsStore.getState();
    expect(recordQuiz('beginner', 3, 5)).toBe(true);
    expect(recordQuiz('beginner', 2, 5)).toBe(false);
    expect(recordQuiz('beginner', 5, 5)).toBe(true);
    expect(useSettingsStore.getState().quizBest.beginner).toMatchObject({ score: 5, total: 5 });
    expect(useSettingsStore.getState().quizBest.beginner?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('rejects impossible scores', () => {
    const { recordQuiz } = useSettingsStore.getState();
    expect(recordQuiz('all', 6, 5)).toBe(false);
    expect(recordQuiz('all', -1, 5)).toBe(false);
    expect(recordQuiz('all', 1, 0)).toBe(false);
    expect(recordQuiz('all', 1.5, 5)).toBe(false);
    expect(useSettingsStore.getState().quizBest).toEqual({});
  });
});

describe('resetAll', () => {
  it('restores defaults and removes the saved copy', () => {
    const s = useSettingsStore.getState();
    s.setUnits('imperial');
    s.setMotion('reduced');
    s.setQuality('low');
    s.toggleFavorite('earth');
    s.recordQuiz('all', 3, 5);
    expect(saved()).not.toBeNull();

    useSettingsStore.getState().resetAll();

    const after = useSettingsStore.getState();
    expect(after.units).toBe('metric');
    expect(after.motion).toBe('system');
    expect(after.quality).toBe('auto');
    expect(after.favorites).toEqual([]);
    expect(after.quizBest).toEqual({});
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
