import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Shuffle } from 'lucide-react';
import { facts, getBodyById } from '@/data';
import { FACT_CATEGORIES, type SpaceFact } from '@/data/types';
import { PageHeader, Section } from '@/components/ui/PageShell';
import {
  FACT_CATEGORY_LABELS,
  factOfTheDay,
  filterFacts,
  randomFact,
  type FactFilter,
} from '@/utils/facts';
import { usePageTitle } from '@/utils/usePageTitle';

const FILTERS: { value: FactFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...FACT_CATEGORIES.map((c) => ({ value: c as FactFilter, label: FACT_CATEGORY_LABELS[c] })),
];

function RelatedLinks({ fact }: { fact: SpaceFact }) {
  const related = fact.relatedObjectIds.map((id) => getBodyById(id)).filter(Boolean);
  if (related.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Related objects">
      {related.map((b) => (
        <li key={b!.id}>
          <Link
            to={`/planet/${b!.slug}`}
            className="inline-flex min-h-8 items-center rounded-full border border-brass/30 px-3 text-xs text-brass-soft no-underline transition-colors hover:border-brass hover:bg-brass/10"
          >
            {b!.displayName}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SourceLine({ fact }: { fact: SpaceFact }) {
  return (
    <p className="text-xs text-dust">
      Source:{' '}
      <a
        href={fact.source.url}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1 text-brass-soft underline-offset-4 hover:underline"
      >
        {fact.source.title} <ExternalLink size={12} aria-hidden="true" />
      </a>{' '}
      · reviewed {fact.lastReviewed}
    </p>
  );
}

export default function Facts() {
  usePageTitle('Space facts');
  const [today] = useState(() => factOfTheDay(facts));
  const [spotlight, setSpotlight] = useState<{ fact: SpaceFact | undefined; random: boolean }>({
    fact: today,
    random: false,
  });
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FactFilter>('all');

  const results = useMemo(() => filterFacts(facts, { query, category }), [query, category]);

  return (
    <>
      <PageHeader eyebrow="Space facts" title={<>Small facts, <span className="brass-text italic">big sky</span></>}>
        {facts.length} short, sourced facts about the Sun and planets. Search them, filter by topic, or let fate pick one.
      </PageHeader>

      {spotlight.fact && (
        <Section>
          <section aria-labelledby="spotlight-title" className="panel p-6 sm:p-8">
            <p id="spotlight-title" className="eyebrow">
              {spotlight.random ? 'Random fact' : 'Fact of the day'}
            </p>
            <p className="mt-4 max-w-3xl font-display text-2xl font-medium leading-snug text-parchment sm:text-3xl">
              {spotlight.fact.text}
            </p>
            <div className="mt-5 space-y-3">
              <RelatedLinks fact={spotlight.fact} />
              <SourceLine fact={spotlight.fact} />
            </div>
            <button
              type="button"
              className="btn btn-ghost mt-6"
              onClick={() =>
                setSpotlight({ fact: randomFact(facts, spotlight.fact?.id), random: true })
              }
            >
              <Shuffle size={18} aria-hidden="true" /> Show another fact
            </button>
            <p role="status" className="sr-only">
              {spotlight.random ? 'Showing a new random fact.' : ''}
            </p>
          </section>
        </Section>
      )}

      <Section eyebrow="Library" title="Browse every fact">
        <div className="flex flex-col gap-5">
          <div>
            <label htmlFor="fact-search" className="eyebrow mb-2 block">
              Search facts
            </label>
            <input
              id="fact-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “Venus”, “storm” or “moon”"
              autoComplete="off"
              className="min-h-12 w-full rounded-2xl border border-brass/30 bg-ink/70 px-4 text-base text-parchment placeholder:text-dust/70 focus:border-brass sm:max-w-md"
            />
          </div>

          <fieldset>
            <legend className="eyebrow mb-2">Topic</legend>
            <ul className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <li key={f.value}>
                  <button
                    type="button"
                    aria-pressed={category === f.value}
                    onClick={() => setCategory(f.value)}
                    className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors ${
                      category === f.value
                        ? 'border-brass bg-brass/15 text-brass-soft'
                        : 'border-brass/25 text-parchment hover:border-brass/60'
                    }`}
                  >
                    {f.label}
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>

          <p role="status" className="font-mono text-xs text-dust">
            Showing {results.length} of {facts.length} facts
          </p>
        </div>

        {results.length === 0 ? (
          <div className="panel mt-6 p-8 text-center">
            <p className="font-display text-2xl text-parchment">No facts match that search</p>
            <p className="mt-2 text-sm text-dust">Try a different word, or clear the topic filter.</p>
            <button
              type="button"
              className="btn btn-ghost mt-5"
              onClick={() => {
                setQuery('');
                setCategory('all');
              }}
            >
              Clear search and filters
            </button>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {results.map((fact) => (
              <li key={fact.id} className="panel flex flex-col gap-4 p-5">
                <p className="eyebrow !text-[0.62rem]">{FACT_CATEGORY_LABELS[fact.category]}</p>
                <p className="flex-1 text-base leading-relaxed text-parchment">{fact.text}</p>
                <RelatedLinks fact={fact} />
                <SourceLine fact={fact} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
