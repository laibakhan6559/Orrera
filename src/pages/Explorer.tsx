import { Suspense, lazy, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { List, X } from 'lucide-react';
import { getBodyBySlug } from '@/data';
import { ControlsBar } from '@/components/explorer/ControlsBar';
import { ErrorBoundary } from '@/components/explorer/ErrorBoundary';
import { InfoPanel } from '@/components/explorer/InfoPanel';
import { ObjectList } from '@/components/explorer/ObjectList';
import { WebGLFallback } from '@/components/explorer/WebGLFallback';
import { useExplorerStore } from '@/store/explorerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { isWebGLAvailable } from '@/utils/webgl';
import { usePrefersReducedMotion } from '@/utils/useReducedMotion';
import { usePageTitle } from '@/utils/usePageTitle';

// three.js is large, so the canvas is only downloaded when this page opens.
const ExplorerCanvas = lazy(() => import('@/components/explorer/ExplorerCanvas'));

function LoadingOverlay() {
  return (
    <div role="status" className="absolute inset-0 z-20 grid place-items-center bg-void">
      <div className="text-center">
        <span
          aria-hidden="true"
          className="mx-auto block size-12 animate-spin rounded-full border-2 border-brass/20 border-t-brass-soft"
        />
        <p className="eyebrow mt-5">Calibrating the orrery</p>
      </div>
    </div>
  );
}

export default function Explorer() {
  const [params] = useSearchParams();
  const focusSlug = params.get('focus');

  const [webglSupported] = useState(() => isWebGLAvailable());
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedId = useExplorerStore((s) => s.selectedId);
  const systemReducedMotion = usePrefersReducedMotion();
  const motionPref = useSettingsStore((s) => s.motion);
  const reducedMotion = systemReducedMotion || motionPref === 'reduced';
  usePageTitle('3D Explorer');

  // Start from the overview, or from ?focus=earth when linked from a planet page.
  useEffect(() => {
    const focus = getBodyBySlug(focusSlug ?? undefined);
    useExplorerStore.setState({ selectedId: focus?.id ?? null, hoveredId: null });
    return () => useExplorerStore.setState({ hoveredId: null });
  }, [focusSlug]);

  // Respect reduced motion: calm camera moves, and start paused.
  useEffect(() => {
    const { setReducedMotion, setPlaying } = useExplorerStore.getState();
    setReducedMotion(reducedMotion);
    if (reducedMotion) setPlaying(false);
  }, [reducedMotion]);

  // Escape closes the drawer first, then clears the selection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (drawerOpen) setDrawerOpen(false);
      else if (useExplorerStore.getState().selectedId) useExplorerStore.getState().select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  if (!webglSupported) return <WebGLFallback reason="unsupported" />;
  if (failed) return <WebGLFallback reason="failed" />;

  return (
    <div className="relative h-[calc(100dvh-4rem)] min-h-[34rem] w-full overflow-hidden border-b border-brass/15">
      <h1 className="sr-only">3D Explorer</h1>

      <ErrorBoundary onError={() => setFailed(true)}>
        <Suspense fallback={null}>
          <ExplorerCanvas onReady={() => setReady(true)} onFailure={() => setFailed(true)} />
        </Suspense>
      </ErrorBoundary>

      {!ready && <LoadingOverlay />}

      {/* Honest scale note, always visible */}
      <p className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-brass/25 bg-void/70 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-dust backdrop-blur-sm">
        Not to scale<span className="hidden sm:inline"> · Animation is illustrative</span>
      </p>

      {/* Desktop: object list */}
      <aside aria-label="Solar System objects" className="absolute bottom-24 left-4 top-4 z-10 hidden w-64 md:block">
        <div className="panel h-full overflow-y-auto p-3">
          <ObjectList />
        </div>
      </aside>

      {/* Mobile: drawer for the object list */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        aria-expanded={drawerOpen}
        aria-controls="objects-drawer"
        className="panel absolute left-3 top-3 z-10 inline-flex min-h-11 items-center gap-2 !rounded-full px-4 text-sm font-medium text-parchment md:hidden"
      >
        <List size={18} aria-hidden="true" /> Objects
      </button>

      {drawerOpen && (
        <div className="absolute inset-0 z-30 md:hidden">
          <button
            type="button"
            aria-label="Close object list"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div id="objects-drawer" role="dialog" aria-label="Solar System objects" className="absolute inset-y-0 left-0 w-72 max-w-[85%] p-3">
            <div className="panel flex h-full flex-col p-3">
              <button
                type="button"
                aria-label="Close object list"
                onClick={() => setDrawerOpen(false)}
                className="mb-1 ml-auto grid size-10 place-items-center rounded-full border border-brass/30 text-dust"
              >
                <X size={18} aria-hidden="true" />
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <ObjectList onPick={() => setDrawerOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info panel: right side on desktop, bottom sheet on mobile */}
      {selectedId && (
        <div className="absolute inset-x-3 bottom-[4.9rem] z-10 flex max-h-[min(21rem,44dvh)] flex-col md:inset-x-auto md:bottom-24 md:right-4 md:top-4 md:max-h-none md:w-80 md:justify-start">
          <InfoPanel />
        </div>
      )}

      {/* Controls */}
      <div className="absolute inset-x-3 bottom-3 z-10 md:inset-x-auto md:bottom-4 md:left-1/2 md:-translate-x-1/2">
        <ControlsBar />
      </div>
    </div>
  );
}
