import { create } from 'zustand';

export const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 5, 10] as const;
export const MIN_SPEED = 0.1;
export const MAX_SPEED = 20;

export interface ExplorerState {
  /** id of the focused body, or null for the overview. */
  selectedId: string | null;
  hoveredId: string | null;
  playing: boolean;
  /** Animation time multiplier. */
  speed: number;
  showOrbits: boolean;
  showLabels: boolean;
  /** Mirrors the visitor's prefers-reduced-motion setting. */
  reducedMotion: boolean;
  /** Bumped every time "Reset view" is pressed so the camera can react. */
  resetNonce: number;

  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  setSpeed: (speed: number) => void;
  toggleOrbits: () => void;
  toggleLabels: () => void;
  setReducedMotion: (value: boolean) => void;
  resetView: () => void;
}

/**
 * Shared state for the 3D explorer. The 3D scene reads it with
 * `useExplorerStore.getState()` inside animation frames, so changing the speed
 * or pausing never re-renders the whole scene.
 */
export const useExplorerStore = create<ExplorerState>()((set) => ({
  selectedId: null,
  hoveredId: null,
  playing: true,
  speed: 1,
  showOrbits: true,
  showLabels: true,
  reducedMotion: false,
  resetNonce: 0,

  select: (id) => set({ selectedId: id }),
  hover: (id) => set({ hoveredId: id }),
  setPlaying: (playing) => set({ playing }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setSpeed: (speed) => {
    if (!Number.isFinite(speed)) return;
    set({ speed: Math.min(MAX_SPEED, Math.max(MIN_SPEED, speed)) });
  },
  toggleOrbits: () => set((s) => ({ showOrbits: !s.showOrbits })),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  resetView: () =>
    set((s) => ({ selectedId: null, hoveredId: null, resetNonce: s.resetNonce + 1 })),
}));
