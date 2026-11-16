import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Settings2, Trophy } from 'lucide-react';
import { getBodyById } from '@/data';
import { resultMessage, type QuizResult } from '@/utils/quiz';

interface QuizResultsProps {
  result: QuizResult;
  isNewBest: boolean;
  onAgain: () => void;
  onChange: () => void;
}

export function QuizResults({ result, isNewBest, onAgain, onChange }: QuizResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="space-y-6">
      <section aria-labelledby="result-title" className="panel p-6 text-center sm:p-10">
        <p className="eyebrow">Quiz complete</p>
        <h2 id="result-title" ref={headingRef} tabIndex={-1} className="mt-4 font-display text-6xl font-semibold text-brass-soft outline-none sm:text-7xl">
          {result.score}
          <span className="text-dust"> / {result.total}</span>
        </h2>
        <p className="mt-2 font-mono text-sm text-dust">{result.percent}% correct</p>
        <p className="mx-auto mt-5 max-w-md text-lg text-parchment">{resultMessage(result.percent)}</p>
        {isNewBest && (
          <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-brass/60 bg-brass/15 px-4 py-1.5 text-sm font-semibold text-brass-soft">
            <Trophy size={16} aria-hidden="true" /> New personal best
          </p>
        )}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" className="btn btn-primary" onClick={onAgain}>
            <RotateCcw size={18} aria-hidden="true" /> Play again
          </button>
          <button type="button" className="btn btn-ghost" onClick={onChange}>
            <Settings2 size={18} aria-hidden="true" /> Change settings
          </button>
        </div>
      </section>

      <section aria-labelledby="review-title">
        <h2 id="review-title" className="eyebrow mb-4">
          {result.missed.length === 0 ? 'Review' : `Review: ${result.missed.length} to revisit`}
        </h2>
        {result.missed.length === 0 ? (
          <p className="panel p-6 text-dust">You answered everything correctly. Nothing to review.</p>
        ) : (
          <ul className="space-y-4">
            {result.missed.map(({ question, chosen }) => {
              const related = question.relatedObjectIds.map((id) => getBodyById(id)).filter(Boolean);
              return (
                <li key={question.id} className="panel p-5 sm:p-6">
                  <p className="font-display text-xl font-semibold text-parchment">{question.question}</p>
                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-dust">Your answer:</dt>
                      <dd className="text-ember">{chosen === null ? 'Skipped' : question.choices[chosen]}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-dust">Correct answer:</dt>
                      <dd className="text-emerald-300">{question.choices[question.correctIndex]}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm leading-relaxed text-parchment/85">{question.explanation}</p>
                  {related.length > 0 && (
                    <p className="mt-3 text-sm text-dust">
                      Learn more:{' '}
                      {related.map((b, i) => (
                        <span key={b!.id}>
                          {i > 0 && ', '}
                          <Link to={`/planet/${b!.slug}`} className="text-brass-soft underline-offset-4 hover:underline">
                            {b!.displayName}
                          </Link>
                        </span>
                      ))}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
