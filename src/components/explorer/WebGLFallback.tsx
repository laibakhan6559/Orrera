import { Link } from 'react-router-dom';
import { planets, sun } from '@/data';
import { PlanetOrb } from '@/components/planets/PlanetOrb';
import { PageHeader, Section } from '@/components/ui/PageShell';

/** Shown when WebGL is missing or the 3D scene fails. Every object stays reachable. */
export function WebGLFallback({ reason }: { reason: 'unsupported' | 'failed' }) {
  const objects = [sun, ...planets];
  return (
    <>
      <PageHeader eyebrow="3D Explorer" title={<>The 3D view is <span className="brass-text italic">unavailable</span></>}>
        {reason === 'unsupported'
          ? 'This browser or device does not support WebGL, which the 3D scene needs. '
          : 'The 3D scene could not start on this device. Reloading the page may help. '}
        You can still read about every world below.
      </PageHeader>

      <Section eyebrow="Object list" title="Choose a world">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {objects.map((o) => (
            <li key={o.id}>
              <Link
                to={`/planet/${o.slug}`}
                className="panel flex items-center gap-4 p-4 no-underline transition hover:border-brass/60"
              >
                <PlanetOrb body={o} size={o.objectType === 'star' ? 36 : 44} className="mx-1" />
                <span>
                  <span className="block font-display text-lg font-semibold text-parchment">{o.displayName}</span>
                  <span className="block text-sm text-dust">{o.tagline}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
