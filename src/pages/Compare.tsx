import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getBodyById, planets } from '@/data';
import { CompareTable } from '@/components/compare/CompareTable';
import { SizeChart } from '@/components/compare/SizeChart';
import { PlanetOrb } from '@/components/planets/PlanetOrb';
import { PageHeader, Section } from '@/components/ui/PageShell';
import { useSettingsStore } from '@/store/settingsStore';
import {
  MAX_COMPARE,
  MIN_COMPARE,
  buildComparison,
  parseSelection,
  toggleSelection,
} from '@/utils/compare';
import { usePageTitle } from '@/utils/usePageTitle';

const planetIds = planets.map((p) => p.id);

export default function Compare() {
  usePageTitle('Compare planets');
  const [params, setParams] = useSearchParams();
  const units = useSettingsStore((s) => s.units);

  const selectedIds = useMemo(() => parseSelection(params.get('p'), planetIds), [params]);
  const selected = useMemo(() => planets.filter((p) => selectedIds.includes(p.id)), [selectedIds]);
  const rows = useMemo(() => buildComparison(selected, units, getBodyById('earth')), [selected, units]);

  const atMax = selectedIds.length >= MAX_COMPARE;
  const atMin = selectedIds.length <= MIN_COMPARE;

  const toggle = (id: string) => {
    const next = toggleSelection(selectedIds, id);
    if (next !== selectedIds) setParams({ p: next.join(',') }, { replace: true });
  };

  return (
    <>
      <PageHeader eyebrow="Compare" title={<>Weigh one world <span className="brass-text italic">against another</span></>}>
        Pick two to four planets and see how they measure up. Values use real measurements with units; the
        selection is saved in the page address, so you can share it.
      </PageHeader>

      <Section>
        <fieldset>
          <legend className="eyebrow mb-4">Choose {MIN_COMPARE} to {MAX_COMPARE} planets</legend>
          <ul className="flex flex-wrap gap-2">
            {planets.map((planet) => {
              const isSelected = selectedIds.includes(planet.id);
              const blocked = isSelected ? atMin : atMax;
              return (
                <li key={planet.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    aria-disabled={blocked || undefined}
                    onClick={() => !blocked && toggle(planet.id)}
                    className={`inline-flex min-h-11 items-center gap-2.5 rounded-full border py-1 pl-2.5 pr-4 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'border-brass bg-brass/15 text-brass-soft'
                        : 'border-brass/25 text-parchment hover:border-brass/60'
                    } ${blocked ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <PlanetOrb body={planet} size={24} />
                    {planet.displayName}
                  </button>
                </li>
              );
            })}
          </ul>
          <p role="status" className="mt-4 font-mono text-xs text-dust">
            {selectedIds.length} of {MAX_COMPARE} selected.{' '}
            {atMax
              ? 'Deselect one to pick a different planet.'
              : atMin
                ? 'At least two planets are needed.'
                : 'You can add more or remove some.'}
          </p>
        </fieldset>
      </Section>

      <Section eyebrow="Size" title="How big are they, really?">
        <SizeChart selected={selected} />
      </Section>

      <Section eyebrow="Side by side" title="The numbers">
        <CompareTable selected={selected} rows={rows} />
        <p className="mt-4 text-xs leading-relaxed text-dust">
          Gas and ice giants have no solid surface, so their gravity and temperature are values at the 1-bar pressure
          level. Source: NASA Planetary Fact Sheet. Change units in Settings.
        </p>
      </Section>
    </>
  );
}
