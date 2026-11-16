import { Link } from 'react-router-dom';
import type { CelestialBody } from '@/data/types';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { useSettingsStore } from '@/store/settingsStore';
import { formatDistance } from '@/utils/units';
import { PlanetOrb } from './PlanetOrb';
import { PLANET_TYPE_LABEL } from './labels';

export function PlanetCard({ planet }: { planet: CelestialBody }) {
  const units = useSettingsStore((s) => s.units);

  return (
    <div className="group relative">
      <Link
        to={`/planet/${planet.slug}`}
        className="panel flex h-full flex-col overflow-hidden p-5 no-underline transition duration-300 hover:-translate-y-1 hover:border-brass/60"
        style={{ ['--accent' as string]: planet.visual.accent }}
      >
        <p
          className="font-mono text-[0.68rem] uppercase tracking-[0.14em]"
          style={{ color: planet.visual.accent }}
        >
          {String(planet.orderFromSun).padStart(2, '0')}
          {planet.planetType ? ` · ${PLANET_TYPE_LABEL[planet.planetType]}` : ''}
        </p>

        <div className="grid flex-1 place-items-center py-7">
          <div className="transition-transform duration-500 group-hover:scale-110">
            <PlanetOrb body={planet} size={88} />
          </div>
        </div>

        <h3 className="font-display text-2xl font-semibold text-parchment">{planet.displayName}</h3>
        <p className="mt-1 text-sm text-dust">{planet.tagline}</p>
        <p className="mt-4 border-t border-brass/15 pt-3 font-mono text-xs text-dust">
          {planet.orbit
            ? `${formatDistance(planet.orbit.meanDistanceFromSunKm, units)} from the Sun`
            : 'At the centre'}
        </p>
      </Link>

      {/* Sits beside the link, not inside it, so a button is never nested in an anchor. */}
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton body={planet} />
      </div>
    </div>
  );
}
