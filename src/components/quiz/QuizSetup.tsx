import { useState } from 'react';
import { Play } from 'lucide-react';
import { quizQuestions } from '@/data';
import { OptionGroup } from '@/components/ui/OptionGroup';
import { QUIZ_KEYS, useSettingsStore } from '@/store/settingsStore';
import {
  DIFFICULTY_LABELS,
  availableCount,
  effectiveCount,
  type DifficultyFilter,
  type QuizLength,
} from '@/utils/quiz';

interface QuizSetupProps {
  onStart: (difficulty: DifficultyFilter, length: QuizLength) => void;
}

const LENGTH_OPTIONS: { value: string; label: string }[] = [
  { value: '5', label: '5 questions' },
  { value: '10', label: '10 questions' },
  { value: 'all', label: 'All available' },
];

const toLength = (value: string): QuizLength => (value === 'all' ? 'all' : value === '10' ? 10 : 5);

export function QuizSetup({ onStart }: QuizSetupProps) {
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [length, setLength] = useState('5');
  const quizBest = useSettingsStore((s) => s.quizBest);

  const available = availableCount(quizQuestions, difficulty);
  const count = effectiveCount(available, toLength(length));

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <form
        className="panel space-y-8 p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          onStart(difficulty, toLength(length));
        }}
      >
        <OptionGroup<DifficultyFilter>
          legend="Difficulty"
          name="difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={QUIZ_KEYS.map((key) => ({
            value: key,
            label: DIFFICULTY_LABELS[key],
            hint: `${availableCount(quizQuestions, key)} questions`,
          }))}
        />
        <OptionGroup<string>
          legend="Length"
          name="length"
          value={length}
          onChange={setLength}
          options={LENGTH_OPTIONS}
        />
        <div>
          <button type="submit" className="btn btn-primary" disabled={count === 0}>
            <Play size={18} aria-hidden="true" /> Start quiz ({count} {count === 1 ? 'question' : 'questions'})
          </button>
          <p className="mt-3 text-xs text-dust">
            Questions and answer order are shuffled every time. Press 1 to 4 to answer quickly.
          </p>
        </div>
      </form>

      <section aria-labelledby="best-title" className="panel p-6 sm:p-8">
        <h2 id="best-title" className="eyebrow">
          Your best scores
        </h2>
        <dl className="mt-5 divide-y divide-brass/10">
          {QUIZ_KEYS.map((key) => {
            const best = quizBest[key];
            return (
              <div key={key} className="flex items-baseline justify-between gap-4 py-3">
                <dt className="text-sm text-dust">{DIFFICULTY_LABELS[key]}</dt>
                <dd className="text-right font-display text-lg text-parchment">
                  {best ? (
                    <>
                      {best.score}/{best.total}
                      <span className="ml-2 font-mono text-xs text-dust">{best.date}</span>
                    </>
                  ) : (
                    <span className="text-sm text-dust">Not played yet</span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-4 text-xs text-dust">Saved on this device only.</p>
      </section>
    </div>
  );
}
