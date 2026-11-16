import { Orbit, Pause, Play, RotateCcw, Tag } from 'lucide-react';
import { SPEED_OPTIONS, useExplorerStore } from '@/store/explorerStore';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors';
const idle = 'border-brass/30 text-parchment hover:border-brass/70 hover:bg-brass/10';
const on = 'border-brass/70 bg-brass/15 text-brass-soft';

/** Play/pause, speed, orbit and label toggles, and reset view. */
export function ControlsBar() {
  const playing = useExplorerStore((s) => s.playing);
  const speed = useExplorerStore((s) => s.speed);
  const showOrbits = useExplorerStore((s) => s.showOrbits);
  const showLabels = useExplorerStore((s) => s.showLabels);
  const store = useExplorerStore.getState;

  return (
    <div role="toolbar" aria-label="Scene controls" className="panel flex flex-wrap items-center justify-center gap-2 !rounded-3xl p-2">
      <button
        type="button"
        onClick={() => store().togglePlaying()}
        aria-pressed={playing}
        aria-label={playing ? 'Pause animation' : 'Play animation'}
        className={`${base} ${playing ? on : idle}`}
      >
        {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
        <span className="hidden sm:inline">{playing ? 'Pause' : 'Play'}</span>
      </button>

      <label className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brass/30 pl-3.5 pr-1.5 text-sm text-parchment">
        <span className="hidden font-mono text-[0.65rem] uppercase tracking-wider text-dust sm:inline">Speed</span>
        <select
          aria-label="Animation speed"
          value={speed}
          onChange={(e) => store().setSpeed(Number(e.target.value))}
          className="min-h-9 cursor-pointer rounded-full bg-transparent px-2 font-mono text-sm text-brass-soft outline-none"
        >
          {SPEED_OPTIONS.map((s) => (
            <option key={s} value={s} className="bg-ink text-parchment">
              {s}×
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() => store().toggleOrbits()}
        aria-pressed={showOrbits}
        aria-label="Show orbits"
        className={`${base} ${showOrbits ? on : idle}`}
      >
        <Orbit size={18} aria-hidden="true" />
        <span className="hidden sm:inline">Orbits</span>
      </button>

      <button
        type="button"
        onClick={() => store().toggleLabels()}
        aria-pressed={showLabels}
        aria-label="Show labels"
        className={`${base} ${showLabels ? on : idle}`}
      >
        <Tag size={18} aria-hidden="true" />
        <span className="hidden sm:inline">Labels</span>
      </button>

      <button type="button" onClick={() => store().resetView()} aria-label="Reset view" className={`${base} ${idle}`}>
        <RotateCcw size={18} aria-hidden="true" />
        <span className="hidden sm:inline">Reset</span>
      </button>
    </div>
  );
}
