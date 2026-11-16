import type { CelestialBody } from '@/data/types';
import { PlanetOrb } from '@/components/planets/PlanetOrb';
import { relativeSizes } from '@/utils/compare';
import { formatNumber } from '@/utils/units';

/** Selected planets drawn in true relative diameter. Not a map of distances. */
export function SizeChart({ selected }: { selected: CelestialBody[] }) {
  const sizes = relativeSizes(selected, 168);
  const earthDiameter = selected.find((b) => b.id === 'earth')?.physical.equatorialDiameterKm ?? 12756;

  return (
    <figure className="panel p-6 sm:p-8">
      <div className="flex min-h-48 flex-wrap items-end justify-center gap-x-10 gap-y-8">
        {selected.map((body, i) => {
          const size = sizes[i];
          const vsEarth = (body.physical.equatorialDiameterKm ?? 0) / earthDiameter;
          return (
            <div key={body.id} className="flex flex-col items-center gap-3 text-center">
              <PlanetOrb body={body} size={size.px} />
              <div>
                <p className="font-display text-lg font-semibold text-parchment">{body.displayName}</p>
                <p className="font-mono text-xs text-dust">
                  {body.id === 'earth' ? 'Reference' : `${formatNumber(Number(vsEarth.toPrecision(3)), 3)}× Earth`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-6 border-t border-brass/15 pt-4 text-xs leading-relaxed text-dust">
        Drawn in true proportion to each planet&apos;s equatorial diameter. Distances and positions are not shown,
        and Saturn&apos;s rings are not included in its size.
      </figcaption>
    </figure>
  );
}
