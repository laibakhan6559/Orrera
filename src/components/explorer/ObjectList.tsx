import { planets, sun } from '@/data';
import { PlanetOrb } from '@/components/planets/PlanetOrb';
import { useExplorerStore } from '@/store/explorerStore';

const objects = [sun, ...planets];

interface ObjectListProps {
  /** Called after a pick, so the mobile drawer can close itself. */
  onPick?: () => void;
}

/** Accessible, non-3D way to choose the Sun or a planet. Works with keyboard and screen readers. */
export function ObjectList({ onPick }: ObjectListProps) {
  const selectedId = useExplorerStore((s) => s.selectedId);

  return (
    <div>
      <h2 className="eyebrow mb-3 px-2">Objects</h2>
      <ul className="space-y-1">
        {objects.map((o) => {
          const active = selectedId === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => {
                  useExplorerStore.getState().select(o.id);
                  onPick?.();
                }}
                onMouseEnter={() => useExplorerStore.getState().hover(o.id)}
                onMouseLeave={() => useExplorerStore.getState().hover(null)}
                onFocus={() => useExplorerStore.getState().hover(o.id)}
                onBlur={() => useExplorerStore.getState().hover(null)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 text-left transition-colors ${
                  active
                    ? 'border-brass/60 bg-brass/10'
                    : 'border-transparent hover:border-brass/25 hover:bg-brass/5'
                }`}
              >
                <span className="grid w-9 place-items-center">
                  <PlanetOrb body={o} size={o.objectType === 'star' ? 26 : 28} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-semibold leading-tight text-parchment">
                    {o.displayName}
                  </span>
                  <span className="block truncate text-xs text-dust">{o.tagline}</span>
                </span>
                <span className="font-mono text-[0.65rem] text-dust">
                  {o.orderFromSun === 0 ? '--' : String(o.orderFromSun).padStart(2, '0')}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
