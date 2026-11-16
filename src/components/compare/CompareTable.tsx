import type { CelestialBody } from '@/data/types';
import { PlanetOrb } from '@/components/planets/PlanetOrb';
import type { CompareRow } from '@/utils/compare';

interface CompareTableProps {
  selected: CelestialBody[];
  rows: CompareRow[];
}

/** Side-by-side values with units. Bars are only a visual aid; the numbers carry the meaning. */
export function CompareTable({ selected, rows }: CompareTableProps) {
  return (
    <div
      className="panel overflow-x-auto"
      role="region"
      aria-label="Comparison table, scrolls sideways on small screens"
      tabIndex={0}
    >
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <caption className="sr-only">
          Comparison of {selected.map((b) => b.displayName).join(', ')}
        </caption>
        <thead>
          <tr className="border-b border-brass/20">
            <td className="sticky left-0 z-10 bg-panel px-4 py-4" />
            {selected.map((body) => (
              <th key={body.id} scope="col" className="px-4 py-4 align-bottom">
                <span className="flex items-center gap-3">
                  <PlanetOrb body={body} size={30} />
                  <span className="font-display text-xl font-semibold text-parchment">{body.displayName}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brass/10">
          {rows.map((row) => (
            <tr key={row.id}>
              <th
                scope="row"
                className="sticky left-0 z-10 bg-panel px-4 py-4 align-top font-mono text-[0.68rem] font-normal uppercase tracking-[0.14em] text-dust"
              >
                {row.label}
              </th>
              {row.cells.map((cell) => {
                const body = selected.find((b) => b.id === cell.bodyId) as CelestialBody;
                return (
                  <td key={cell.bodyId} className="px-4 py-4 align-top">
                    <span
                      className={`block font-display text-base ${cell.isMax ? 'text-brass-soft' : 'text-parchment'}`}
                    >
                      {cell.text}
                      {cell.isMax && <span className="sr-only"> (highest in this comparison)</span>}
                    </span>
                    {cell.note && <span className="mt-0.5 block text-xs text-dust">{cell.note}</span>}
                    {cell.ratio !== null && (
                      <span aria-hidden="true" className="mt-2 block h-1.5 w-full rounded-full bg-brass/10">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${Math.max(2, cell.ratio * 100)}%`,
                            background: body.visual.accent,
                          }}
                        />
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
