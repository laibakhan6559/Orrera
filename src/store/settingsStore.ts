import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { bodies } from '@/data';
import type { QuizDifficulty } from '@/data/types';
import type { QualityPref } from '@/utils/quality';
import type { UnitSystem } from '@/utils/units';

export const STORAGE_KEY = 'orrera:v1';

export type MotionPref = 'system' | 'reduced';
export type QuizKey = 'all' | QuizDifficulty;
export const QUIZ_KEYS: QuizKey[] = ['all', 'beginner', 'intermediate', 'advanced'];

export interface QuizBest {
  score: number;
  total: number;
  /** ISO date (YYYY-MM-DD). */
  date: string;
}

export interface PersistedSettings {
  units: UnitSystem;
  motion: MotionPref;
  quality: QualityPref;
  /** Body ids, in the order they were added. */
  favorites: string[];
  quizBest: Partial<Record<QuizKey, QuizBest>>;
}

export interface SettingsState extends PersistedSettings {
  setUnits: (units: UnitSystem) => void;
  setMotion: (motion: MotionPref) => void;
  setQuality: (quality: QualityPref) => void;
  toggleFavorite: (id: string) => void;
  clearFavorites: () => void;
  /** Stores the result if it beats the previous best. Returns true when it did. */
  recordQuiz: (key: QuizKey, score: number, total: number) => boolean;
  /** Back to defaults and removes the saved copy from the browser. */
  resetAll: () => void;
}

const KNOWN_IDS = new Set(bodies.map((b) => b.id));

const freshDefaults = (): PersistedSettings => ({
  units: 'metric',
  motion: 'system',
  quality: 'auto',
  favorites: [],
  quizBest: {},
});

/**
 * localStorage can be missing or throw (private mode, blocked site data).
 * Fall back to memory so the app keeps working, just without saving.
 */
const memory = new Map<string, string>();
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      memory.set(name, value);
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      memory.delete(name);
    }
  },
};

/** True when `next` should replace `prev` as the best score. */
export function isBetterResult(prev: QuizBest | undefined, next: Pick<QuizBest, 'score' | 'total'>): boolean {
  if (!prev) return true;
  const a = prev.score / prev.total;
  const b = next.score / next.total;
  if (b !== a) return b > a;
  return next.total > prev.total;
}

function sanitizeBest(value: unknown): QuizBest | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as Record<string, unknown>;
  const { score, total, date } = v;
  if (
    typeof score === 'number' &&
    typeof total === 'number' &&
    Number.isInteger(score) &&
    Number.isInteger(total) &&
    total > 0 &&
    total <= 100 &&
    score >= 0 &&
    score <= total &&
    typeof date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return { score, total, date };
  }
  return undefined;
}

/** Never trust saved data: anything unexpected falls back to the default. */
export function sanitizeSettings(raw: unknown): PersistedSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const defaults = freshDefaults();

  const favorites = Array.isArray(r.favorites)
    ? [...new Set(r.favorites.filter((x): x is string => typeof x === 'string' && KNOWN_IDS.has(x)))]
    : defaults.favorites;

  const quizBest: PersistedSettings['quizBest'] = {};
  const savedBest = r.quizBest && typeof r.quizBest === 'object' ? (r.quizBest as Record<string, unknown>) : {};
  for (const key of QUIZ_KEYS) {
    const entry = sanitizeBest(savedBest[key]);
    if (entry) quizBest[key] = entry;
  }

  return {
    units: r.units === 'imperial' ? 'imperial' : 'metric',
    motion: r.motion === 'reduced' ? 'reduced' : 'system',
    quality: r.quality === 'low' || r.quality === 'high' ? r.quality : 'auto',
    favorites,
    quizBest,
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...freshDefaults(),

      setUnits: (units) => set({ units }),
      setMotion: (motion) => set({ motion }),
      setQuality: (quality) => set({ quality }),

      toggleFavorite: (id) => {
        if (!KNOWN_IDS.has(id)) return;
        set((s) => ({
          favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
        }));
      },
      clearFavorites: () => set({ favorites: [] }),

      recordQuiz: (key, score, total) => {
        const next = { score, total, date: new Date().toISOString().slice(0, 10) };
        if (!Number.isInteger(score) || !Number.isInteger(total) || total <= 0 || score < 0 || score > total) {
          return false;
        }
        if (!isBetterResult(get().quizBest[key], next)) return false;
        set((s) => ({ quizBest: { ...s.quizBest, [key]: next } }));
        return true;
      },

      resetAll: () => {
        set(freshDefaults());
        useSettingsStore.persist.clearStorage();
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s): PersistedSettings => ({
        units: s.units,
        motion: s.motion,
        quality: s.quality,
        favorites: s.favorites,
        quizBest: s.quizBest,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizeSettings(persisted) }),
    },
  ),
);
