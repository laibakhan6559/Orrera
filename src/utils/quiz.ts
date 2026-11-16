import type { QuizDifficulty, QuizQuestion, SourceRef } from '@/data/types';
import { shuffle } from './random';

export type DifficultyFilter = 'all' | QuizDifficulty;
export type QuizLength = 5 | 10 | 'all';
export const QUIZ_LENGTHS: QuizLength[] = [5, 10, 'all'];

export interface PreparedQuestion {
  id: string;
  question: string;
  /** Already shuffled. */
  choices: string[];
  correctIndex: number;
  explanation: string;
  difficulty: QuizDifficulty;
  relatedObjectIds: string[];
  source: SourceRef;
}

export interface QuizResult {
  score: number;
  total: number;
  /** Whole percent, 0 to 100. */
  percent: number;
  missed: { question: PreparedQuestion; chosen: number | null }[];
}

export function availableCount(questions: QuizQuestion[], difficulty: DifficultyFilter): number {
  return difficulty === 'all' ? questions.length : questions.filter((q) => q.difficulty === difficulty).length;
}

/** How many questions a run will really contain. */
export function effectiveCount(available: number, length: QuizLength): number {
  return length === 'all' ? available : Math.min(length, available);
}

/** Picks and shuffles questions, and shuffles each question's choices (keeping the right answer tracked). */
export function buildQuiz(
  questions: QuizQuestion[],
  options: { difficulty: DifficultyFilter; length: QuizLength },
  rng: () => number = Math.random,
): PreparedQuestion[] {
  const pool =
    options.difficulty === 'all' ? questions : questions.filter((q) => q.difficulty === options.difficulty);
  const count = effectiveCount(pool.length, options.length);

  return shuffle(pool, rng)
    .slice(0, count)
    .map((q) => {
      const order = shuffle(
        q.choices.map((_, i) => i),
        rng,
      );
      return {
        id: q.id,
        question: q.question,
        choices: order.map((i) => q.choices[i]),
        correctIndex: order.indexOf(q.correctIndex),
        explanation: q.explanation,
        difficulty: q.difficulty,
        relatedObjectIds: q.relatedObjectIds,
        source: q.source,
      };
    });
}

/** `answers[i]` is the chosen choice index for question i, or null if skipped. */
export function scoreQuiz(questions: PreparedQuestion[], answers: (number | null)[]): QuizResult {
  const missed: QuizResult['missed'] = [];
  let score = 0;
  questions.forEach((question, i) => {
    const chosen = answers[i] ?? null;
    if (chosen === question.correctIndex) score += 1;
    else missed.push({ question, chosen });
  });
  const total = questions.length;
  return { score, total, percent: total === 0 ? 0 : Math.round((score / total) * 100), missed };
}

export function resultMessage(percent: number): string {
  if (percent === 100) return 'Flawless. You could run the observatory.';
  if (percent >= 80) return 'Excellent. You know your neighbourhood well.';
  if (percent >= 60) return 'Good work. A few worlds still hold surprises.';
  if (percent >= 40) return 'A solid start. The facts page will help.';
  return 'Every astronomer starts somewhere. Try again!';
}

export const DIFFICULTY_LABELS: Record<DifficultyFilter, string> = {
  all: 'All levels',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
