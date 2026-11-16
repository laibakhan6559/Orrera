import { Suspense, lazy, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Axis3d, Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react';
import { ErrorBoundary } from '@/components/explorer/ErrorBoundary';
import type { GlobeCommand } from '@/components/globe/GlobeCanvas';
import { PlanetOrb } from '@/components/planets/PlanetOrb';
import { useSettingsStore } from '@/store/settingsStore';
import { VIEW_SPIN_SECONDS, describeRotation, findGlobeBody, globeBodies } from '@/utils/globe';
import { buildStatRows } from '@/utils/stats';
import { isWebGLAvailable } from '@/utils/webgl';
import { usePageTitle } from '@/utils/usePageTitle';
import { usePrefersReducedMotion } from '@/utils/useReducedMotion';

const GlobeCanvas = lazy(() => import('@/components/globe/GlobeCanvas'));

const btn =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors';
const idle = 'border-brass/30 text-parchment hover:border-brass/70 hover:bg-brass/10';
const on = 'border-brass/70 bg-brass/15 text-brass-soft';

function Fallback() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <p className="eyebrow">360° view</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-parchment sm:text-5xl">The 3D view is unavailable</h1>
      <p className="mt-4 text-dust">This device could not start WebGL. You can still read about every world.</p>
      <ul className="mt-8 flex flex-wrap justify-center gap-2">
        {globeBodies.map((b) => (
          <li key={b.id}>
            <Link to={b.id === 'moon' ? '/planet/earth' : `/planet/${b.slug}`} className="btn btn-ghost">
              {b.displayName}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Globe() {
  const [params, setParams] = useSearchParams();
  const body = findGlobeBody(params.get('body'));
  usePageTitle(`${body.displayName} in 360°`);

  const systemReduced = usePrefersReducedMotion();
  const motionPref = useSettingsStore((s) => s.motion);
  const reduced = systemReduced || motionPref === 'reduced';
  const units = useSettingsStore((s) => s.units);

  const [supported] = useState(() => isWebGLAvailable());
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  // Reduced motion keeps the body still; the visitor can still turn it by hand.
  const [spinWanted, setSpinning] = useState(true);
  const spinning = spinWanted && !reduced;
  const [showAxis, setShowAxis] = useState(false);
  const [command, setCommand] = useState<GlobeCommand>({ nonce: 0, kind: 'reset' });
  const send = (kind: GlobeCommand['kind']) => setCommand((c) => ({ nonce: c.nonce + 1, kind }));

  if (!supported || failed) return <Fallback />;

  const stats = buildStatRows(body, units);
  const pick = (id: string) => [...stats.physical, ...stats.motion].find((r) => r.id === id);
  const rows = ['diameter', 'gravity', 'rotation', 'tilt'].map(pick).filter((r) => r !== undefined);
  const retrograde = (body.rotation?.siderealPeriodHours ?? 1) < 0;
  const detailHref = body.id === 'moon' ? '/planet/earth' : `/planet/${body.slug}`;

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col lg:grid lg:h-[calc(100dvh-4rem)] lg:min-h-[36rem] lg:grid-cols-[15rem_1fr_21rem]">
      <h1 className="sr-only">{body.displayName} in 360°</h1>

      {/* Picker: a scrolling row on phones, a column on desktop */}
      <nav aria-label="Choose an object" className="border-b border-brass/15 px-3 py-3 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-4">
        <p className="eyebrow mb-3 hidden lg:block">Choose an object</p>
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {globeBodies.map((b) => {
            const active = b.id === body.id;
            return (
              <li key={b.id} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setParams({ body: b.slug }, { replace: true })}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-full border py-1 pl-2.5 pr-4 text-sm font-medium transition-colors ${
                    active ? on : idle
                  }`}
                >
                  <PlanetOrb body={b} size={24} />
                  {b.displayName}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Canvas and controls */}
      <div className="relative min-h-[26rem] flex-1 lg:min-h-0">
        <ErrorBoundary onError={() => setFailed(true)}>
          <Suspense fallback={null}>
            <GlobeCanvas
              body={body}
              spinning={spinning}
              showAxis={showAxis}
              reducedMotion={reduced}
              command={command}
              onReady={() => setReady(true)}
              onFailure={() => setFailed(true)}
            />
          </Suspense>
        </ErrorBoundary>

        {!ready && (
          <div role="status" className="absolute inset-0 z-20 grid place-items-center bg-void">
            <p className="eyebrow">Polishing the globe</p>
          </div>
        )}

        <p className="pointer-events-none absolute left-1/2 top-3 z-10 w-max max-w-[92%] -translate-x-1/2 rounded-full border border-brass/25 bg-void/70 px-3 py-1 text-center font-mono text-[0.62rem] uppercase tracking-[0.14em] text-dust backdrop-blur-sm">
          Drag to turn · Scroll or pinch to zoom
        </p>

        <div className="absolute inset-x-3 bottom-3 z-10 flex justify-center">
        <div role="toolbar" aria-label="Viewer controls" className="panel flex flex-wrap items-center justify-center gap-2 !rounded-3xl p-2">
          <button type="button" aria-pressed={spinning} aria-label="Spin" onClick={() => setSpinning(!spinWanted)} className={`${btn} ${spinning ? on : idle}`}>
            {spinning ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            <span className="hidden sm:inline">Spin</span>
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => send('zoom-out')} className={`${btn} ${idle}`}>
            <Minus size={18} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Zoom in" onClick={() => send('zoom-in')} className={`${btn} ${idle}`}>
            <Plus size={18} aria-hidden="true" />
          </button>
          <button type="button" aria-pressed={showAxis} aria-label="Show spin axis" onClick={() => setShowAxis((v) => !v)} className={`${btn} ${showAxis ? on : idle}`}>
            <Axis3d size={18} aria-hidden="true" />
            <span className="hidden sm:inline">Axis</span>
          </button>
          <button type="button" aria-label="Reset view" onClick={() => send('reset')} className={`${btn} ${idle}`}>
            <RotateCcw size={18} aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
        </div>
      </div>

      {/* Facts about the chosen object */}
      <aside aria-label={`About ${body.displayName}`} className="border-t border-brass/15 p-5 lg:overflow-y-auto lg:border-l lg:border-t-0">
        <p className="eyebrow" style={{ color: body.visual.accent }}>
          {body.objectType === 'star' ? 'Star' : body.objectType === 'moon' ? 'Moon of Earth' : `Planet ${body.orderFromSun}`}
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-parchment">{body.displayName}</h2>
        <p className="mt-1 font-display italic text-dust">{body.tagline}</p>

        <dl className="mt-5 space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="flex items-baseline justify-between gap-4 border-b border-brass/10 pb-2">
              <dt className="text-sm text-dust">{r.id === 'rotation' ? 'One real spin takes' : r.label}</dt>
              <dd className="text-right font-mono text-sm text-parchment">
                {r.id === 'rotation' ? describeRotation(body.rotation?.siderealPeriodHours) : r.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 text-sm leading-relaxed text-parchment/85">
          {retrograde
            ? `${body.displayName} spins backwards compared with most planets, so the Sun would rise in the west.`
            : body.id === 'moon'
              ? 'The Moon turns once per orbit, so one face always points at Earth.'
              : `The dashed axis shows where ${body.displayName} spins. Its tilt is why days and seasons differ.`}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-dust">
          The spin here is sped up so you can see a full turn in about {VIEW_SPIN_SECONDS} seconds. Surfaces are illustrations, not photographs.
        </p>

        <Link to={detailHref} className="btn btn-primary mt-6">
          {body.id === 'moon' ? 'About Earth' : `Full ${body.displayName} page`} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </aside>
    </div>
  );
}
