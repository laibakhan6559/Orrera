import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ eyebrow, title, children }: PageHeaderProps) {
  return (
    <header className="mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6 sm:pt-20">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.08] text-parchment sm:text-5xl md:text-6xl">
        {title}
      </h1>
      {children && <div className="mt-5 max-w-2xl text-base leading-relaxed text-dust sm:text-lg">{children}</div>}
    </header>
  );
}

interface SectionProps {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ id, eyebrow, title, children, className = '' }: SectionProps) {
  return (
    <section id={id} className={`mx-auto max-w-6xl scroll-mt-24 px-4 py-10 sm:px-6 ${className}`}>
      {(eyebrow || title) && (
        <div className="mb-8">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && (
            <h2 className="mt-3 font-display text-3xl font-semibold text-parchment sm:text-4xl">
              {title}
            </h2>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

interface ComingSoonProps {
  step: number;
  title: string;
  children: ReactNode;
}

/** Honest placeholder panel for pages built in a later step. */
export function ComingSoon({ step, title, children }: ComingSoonProps) {
  return (
    <div className="panel p-6 sm:p-8">
      <p className="eyebrow">Arrives in Step {step}</p>
      <h2 className="mt-3 font-display text-2xl font-semibold text-parchment">{title}</h2>
      <div className="mt-3 max-w-2xl space-y-3 text-sm leading-relaxed text-dust sm:text-base">
        {children}
      </div>
    </div>
  );
}
