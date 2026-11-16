import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import type { PreparedQuestion } from '@/utils/quiz';
import { DIFFICULTY_LABELS } from '@/utils/quiz';

interface QuizPlayProps {
  questions: PreparedQuestion[];
  onFinish: (answers: (number | null)[]) => void;
  onQuit: () => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function QuizPlay({ questions, onFinish, onQuit }: QuizPlayProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const answered = selected !== null;
  const correct = answered && selected === question.correctIndex;

  const choose = (choice: number) => {
    if (selected !== null) return;
    setSelected(choice);
  };

  const next = () => {
    const updated = [...answers, selected];
    if (isLast) {
      onFinish(updated);
      return;
    }
    setAnswers(updated);
    setSelected(null);
    setIndex((i) => i + 1);
  };

  // Number keys answer quickly.
  useEffect(() => {
    if (selected !== null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= question.choices.length) {
        setSelected(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, question.choices.length]);

  // Move focus to where the visitor needs it next: the Next button after answering,
  // and the new question after moving on.
  useEffect(() => {
    if (selected !== null) nextRef.current?.focus();
  }, [selected]);
  useEffect(() => {
    if (index > 0) headingRef.current?.focus();
  }, [index]);

  return (
    <section aria-label="Quiz" className="panel p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">
          Question {index + 1} of {questions.length}
        </p>
        <p className="font-mono text-xs uppercase tracking-wider text-dust">{DIFFICULTY_LABELS[question.difficulty]}</p>
      </div>
      <div
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={questions.length}
        aria-valuenow={index + (answered ? 1 : 0)}
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-brass/10"
      >
        <div
          className="h-full rounded-full bg-brass transition-all duration-500"
          style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-8 font-display text-2xl font-semibold leading-snug text-parchment outline-none sm:text-3xl"
      >
        {question.question}
      </h2>

      <ul className="mt-6 space-y-3">
        {question.choices.map((choice, i) => {
          const isCorrect = i === question.correctIndex;
          const isChosen = i === selected;
          let style = 'border-brass/25 hover:border-brass/70 hover:bg-brass/5';
          if (answered && isCorrect) style = 'border-emerald-400/80 bg-emerald-400/10';
          else if (answered && isChosen) style = 'border-ember bg-ember/10';
          else if (answered) style = 'border-brass/15 opacity-60';

          return (
            <li key={choice}>
              <button
                type="button"
                onClick={() => choose(i)}
                aria-disabled={answered || undefined}
                className={`flex min-h-14 w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-colors ${style} ${
                  answered ? 'cursor-default' : ''
                }`}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-brass/40 font-mono text-xs text-brass-soft">
                  {answered && isCorrect ? (
                    <Check size={16} aria-hidden="true" />
                  ) : answered && isChosen ? (
                    <X size={16} aria-hidden="true" />
                  ) : (
                    LETTERS[i]
                  )}
                </span>
                <span className="text-base text-parchment">
                  {choice}
                  {answered && isCorrect && <span className="sr-only"> (correct answer)</span>}
                  {answered && isChosen && !isCorrect && <span className="sr-only"> (your answer, incorrect)</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite" className="mt-6">
        {answered && (
          <div className={`rounded-2xl border p-4 ${correct ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-ember/40 bg-ember/5'}`}>
            <p className="font-display text-lg font-semibold text-parchment">
              {correct ? 'Correct!' : `Not quite. The answer is ${question.choices[question.correctIndex]}.`}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-parchment/85">{question.explanation}</p>
            <p className="mt-2 text-xs text-dust">
              Source:{' '}
              <a
                href={question.source.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-brass-soft underline-offset-4 hover:underline"
              >
                {question.source.title}
              </a>
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="btn btn-ghost" onClick={onQuit}>
          Quit quiz
        </button>
        {answered && (
          <button ref={nextRef} type="button" className="btn btn-primary" onClick={next}>
            {isLast ? 'See results' : 'Next question'} <ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
