import type { CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { getBodyBySlug, getNeighbours } from '@/data';
import { PlanetOrb } from '@/components/planets/PlanetOrb';
import { PLANET_TYPE_LABEL } from '@/components/planets/labels';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { Section } from '@/components/ui/PageShell';
import { useSettingsStore } from '@/store/settingsStore';
import { buildStatRows, type StatRow } from '@/utils/stats';
import { usePageTitle } from '@/utils/usePageTitle';
import NotFound from './NotFound';

function StatList({ rows }: { rows: StatRow[] }) {
  return (
    <dl className="panel divide-y divide-brass/10">
      {rows.map((row) => (
        <div key={row.id} className="grid gap-1 px-5 py-4 sm:grid-cols-[1fr_1.2fr] sm:gap-6">
          <dt className="font-mono text-xs uppercase tracking-[0.16em] text-dust">{row.label}</dt>
          <dd>
            <span className="font-display text-lg text-parchment">{row.value}</span>
            {row.note && <span className="mt-0.5 block text-xs leading-relaxed text-dust">{row.note}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function PlanetDetail() {
  const { slug } = useParams();
  const body = getBodyBySlug(slug);
  const units = useSettingsStore((s) => s.units);
  usePageTitle(body ? body.displayName : 'Object not found');

  if (!body) {
    return (
      <NotFound
        title="Object not found"
        message="That planet or object is not in the ORRERA catalogue. Try one of the eight planets or the Sun."
      />
    );
  }

  const { physical, motion } = buildStatRows(body, units);
  const { previous, next } = getNeighbours(body);
  const typeLabel = body.planetType ? PLANET_TYPE_LABEL[body.planetType] : 'Star';
  const position =
    body.objectType === 'star' ? 'The centre of the Solar System' : `Planet ${body.orderFromSun} from the Sun`;

  return (
    <div style={{ ['--accent' as string]: body.visual.accent } as CSSProperties}>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <Link to="/#planets" className="inline-flex items-center gap-2 text-sm text-dust no-underline hover:text-brass-soft">
          <ArrowLeft size={16} aria-hidden="true" /> All planets
        </Link>
      </div>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-6 pt-8 sm:px-6 md:grid-cols-[auto_1fr] md:gap-16">
        <div
          className={`mx-auto grid place-items-center py-6 ${
            body.visual.hasRings ? 'px-14 sm:px-20 md:px-24' : 'px-6'
          }`}
        >
          <PlanetOrb body={body} size={body.visual.hasRings ? 'min(42vw, 14rem)' : 'min(58vw, 15rem)'} />
        </div>
        <div>
          <p className="eyebrow" style={{ color: 'var(--accent)' }}>
            {typeLabel} · {position}
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-parchment sm:text-7xl">{body.displayName}</h1>
          <p className="mt-2 font-display text-xl italic text-dust">{body.tagline}</p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-parchment/85 sm:text-lg">{body.description}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to={`/explore?focus=${body.slug}`} className="btn btn-primary">
              View {body.displayName} in 3D <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to={`/globe?body=${body.slug}`} className="btn btn-ghost">
              Rotate {body.displayName} 360°
            </Link>
            <FavoriteButton body={body} withLabel />
          </div>
        </div>
      </section>

      {/* Highlights */}
      <Section eyebrow="Highlights" title={`${body.displayName} at a glance`}>
        <ul className="grid gap-4 md:grid-cols-3">
          {body.highlights.map((h) => (
            <li key={h} className="panel p-5 text-sm leading-relaxed text-parchment/90 sm:text-base">
              <span
                aria-hidden="true"
                className="mb-3 block h-px w-10"
                style={{ background: 'var(--accent)' }}
              />
              {h}
            </li>
          ))}
        </ul>
      </Section>

      {/* Stats */}
      <Section eyebrow="By the numbers" title="Measurements">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="eyebrow mb-3">Physical</h3>
            <StatList rows={physical} />
          </div>
          <div>
            <h3 className="eyebrow mb-3">{motion.length ? 'Orbit and rotation' : 'Rotation'}</h3>
            <StatList rows={motion} />
          </div>
        </div>
      </Section>

      {/* Atmosphere and surface */}
      <Section>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="panel p-6">
            <h3 className="eyebrow">{body.objectType === 'star' ? 'Outer layers' : 'Atmosphere'}</h3>
            <p className="mt-3 text-sm leading-relaxed text-parchment/90 sm:text-base">{body.atmosphere}</p>
          </div>
          <div className="panel p-6">
            <h3 className="eyebrow">Surface</h3>
            <p className="mt-3 text-sm leading-relaxed text-parchment/90 sm:text-base">{body.surface}</p>
          </div>
        </div>
      </Section>

      {/* Sources */}
      <Section eyebrow="Sources" title="Where this comes from">
        <div className="panel p-6">
          <ul className="space-y-2">
            {body.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-sm text-brass-soft underline-offset-4 hover:underline"
                >
                  {s.title} <ExternalLink size={14} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <ul className="mt-5 space-y-1.5 border-t border-brass/15 pt-4 text-xs leading-relaxed text-dust">
            {body.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
            <li className="font-mono">
              Source data as of: {body.dataAsOf ?? 'date not stated by the source'} · Record last
              reviewed: {body.lastReviewed}
            </li>
          </ul>
        </div>
      </Section>

      {/* Prev / next */}
      <nav aria-label="Neighbouring objects" className="mx-auto mt-4 flex max-w-6xl justify-between gap-4 px-4 sm:px-6">
        {previous ? (
          <Link to={`/planet/${previous.slug}`} className="btn btn-ghost">
            <ArrowLeft size={16} aria-hidden="true" /> {previous.displayName}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/planet/${next.slug}`} className="btn btn-ghost">
            {next.displayName} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
