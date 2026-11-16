import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { getBodyById } from '@/data';
import { PlanetOrb } from '@/components/planets/PlanetOrb';
import { PLANET_TYPE_LABEL } from '@/components/planets/labels';
import { useExplorerStore } from '@/store/explorerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { buildStatRows } from '@/utils/stats';

/** The handful of facts shown in the panel; the planet page has the full set. */
const SHOWN = ['diameter', 'gravity', 'temperature', 'distance', 'period', 'rotation'];

/** Details for the selected body. Renders nothing in the overview. */
export function InfoPanel() {
  const selectedId = useExplorerStore((s) => s.selectedId);
  const units = useSettingsStore((s) => s.units);
  const body = getBodyById(selectedId ?? undefined);
  if (!body) return null;

  const { physical, motion } = buildStatRows(body, units);
  const rows = SHOWN.map((id) => [...physical, ...motion].find((r) => r.id === id)).filter(
    (r): r is NonNullable<typeof r> => Boolean(r),
  );
  const typeLabel = body.planetType ? PLANET_TYPE_LABEL[body.planetType] : 'Star';

  return (
    <section aria-label={`Selected: ${body.displayName}`} className="panel min-h-0 overflow-y-auto p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid w-12 shrink-0 place-items-center pt-1">
          <PlanetOrb body={body} size={body.objectType === 'star' ? 34 : 40} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow !text-[0.62rem] !tracking-[0.14em]" style={{ color: body.visual.accent }}>
            {typeLabel}
            {body.orderFromSun > 0 ? ` · Planet ${body.orderFromSun}` : ''}
          </p>
          <h2 className="font-display text-2xl font-semibold leading-tight text-parchment">{body.displayName}</h2>
          <p className="text-sm italic text-dust">{body.tagline}</p>
        </div>
        <button
          type="button"
          aria-label="Close details"
          onClick={() => useExplorerStore.getState().select(null)}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-brass/30 text-dust transition-colors hover:text-parchment"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-parchment/85 md:line-clamp-none">
        {body.description}
      </p>

      <dl className="mt-4 divide-y divide-brass/10 border-t border-brass/15">
        {rows.map((row) => (
          <div key={row.id} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-dust">{row.label}</dt>
            <dd className="text-right font-display text-sm text-parchment">{row.value}</dd>
          </div>
        ))}
      </dl>

      <Link to={`/planet/${body.slug}`} className="btn btn-primary mt-4 w-full !min-h-11 !text-sm">
        Full details <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
