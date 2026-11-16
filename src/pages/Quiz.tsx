import { useState } from 'react';
import { quizQuestions } from '@/data';
import { QuizPlay } from '@/components/quiz/QuizPlay';
import { QuizResults } from '@/components/quiz/QuizResults';
import { QuizSetup } from '@/components/quiz/QuizSetup';
import { PageHeader, Section } from '@/components/ui/PageShell';
import { useSettingsStore } from '@/store/settingsStore';
import {
  buildQuiz,
  scoreQuiz,
  type DifficultyFilter,
  type PreparedQuestion,
  type QuizLength,
  type QuizResult,
} from '@/utils/quiz';
import { usePageTitle } from '@/utils/usePageTitle';

type Phase =
  | { kind: 'setup' }
  | { kind: 'playing'; questions: PreparedQuestion[]; difficulty: DifficultyFilter; length: QuizLength }
  | { kind: 'done'; result: QuizResult; isNewBest: boolean; difficulty: DifficultyFilter; length: QuizLength };

export default function Quiz() {
  usePageTitle('Quiz');
  const [phase, setPhase] = useState<Phase>({ kind: 'setup' });
  const recordQuiz = useSettingsStore((s) => s.recordQuiz);

  const start = (difficulty: DifficultyFilter, length: QuizLength) => {
    const questions = buildQuiz(quizQuestions, { difficulty, length });
    if (questions.length === 0) return;
    setPhase({ kind: 'playing', questions, difficulty, length });
  };

  return (
    <>
      {phase.kind === 'setup' ? (
        <PageHeader eyebrow="Quiz" title={<>How well do you know <span className="brass-text italic">the neighbourhood?</span></>}>
          Beginner to advanced questions, with an explanation after every answer.
        </PageHeader>
      ) : (
        <h1 className="sr-only">Solar System quiz</h1>
      )}

      <Section className={phase.kind === 'setup' ? '' : 'pt-12'}>
        {phase.kind === 'setup' && <QuizSetup onStart={start} />}

        {phase.kind === 'playing' && (
          <QuizPlay
            key={phase.questions[0].id + phase.questions.length}
            questions={phase.questions}
            onQuit={() => setPhase({ kind: 'setup' })}
            onFinish={(answers) => {
              const result = scoreQuiz(phase.questions, answers);
              const isNewBest = recordQuiz(phase.difficulty, result.score, result.total);
              setPhase({ kind: 'done', result, isNewBest, difficulty: phase.difficulty, length: phase.length });
            }}
          />
        )}

        {phase.kind === 'done' && (
          <QuizResults
            result={phase.result}
            isNewBest={phase.isNewBest}
            onAgain={() => start(phase.difficulty, phase.length)}
            onChange={() => setPhase({ kind: 'setup' })}
          />
        )}
      </Section>
    </>
  );
}
