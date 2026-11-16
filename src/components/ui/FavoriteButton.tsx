import { Heart } from 'lucide-react';
import type { CelestialBody } from '@/data/types';
import { useSettingsStore } from '@/store/settingsStore';

interface FavoriteButtonProps {
  body: Pick<CelestialBody, 'id' | 'displayName'>;
  /** Show the full action text next to the heart. */
  withLabel?: boolean;
}

/** Heart toggle. Favorites are saved in this browser only. */
export function FavoriteButton({ body, withLabel = false }: FavoriteButtonProps) {
  const isFavorite = useSettingsStore((s) => s.favorites.includes(body.id));
  const toggle = useSettingsStore((s) => s.toggleFavorite);

  const label = `${isFavorite ? 'Remove' : 'Add'} ${body.displayName} ${isFavorite ? 'from' : 'to'} favorites`;

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      // With a visible label the text itself is the name, so the two can never disagree.
      aria-label={withLabel ? undefined : label}
      onClick={() => toggle(body.id)}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border text-sm font-medium transition-colors ${
        withLabel ? 'px-5' : 'size-11'
      } ${
        isFavorite
          ? 'border-ember/70 bg-ember/15 text-ember'
          : 'border-brass/30 text-dust hover:border-brass/70 hover:text-parchment'
      }`}
    >
      <Heart size={18} aria-hidden="true" fill={isFavorite ? 'currentColor' : 'none'} />
      {withLabel && <span>{label}</span>}
    </button>
  );
}
