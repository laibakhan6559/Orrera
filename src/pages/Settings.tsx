import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { getBodyById } from '@/data';
import { OptionGroup } from '@/components/ui/OptionGroup';
import { PageHeader, Section } from '@/components/ui/PageShell';
import {
  QUIZ_KEYS,
  useSettingsStore,
  type MotionPref,
} from '@/store/settingsStore';
import { DIFFICULTY_LABELS } from '@/utils/quiz';
import type { QualityPref } from '@/utils/quality';
import type { UnitSystem } from '@/utils/units';
import { usePageTitle } from '@/utils/usePageTitle';

export default function Settings() {
  usePageTitle('Settings');
  const units = useSettingsStore((s) => s.units);
  const motion = useSettingsStore((s) => s.motion);
  const quality = useSettingsStore((s) => s.quality);
  const favorites = useSettingsStore((s) => s.favorites);
  const quizBest = useSettingsStore((s) => s.quizBest);
  const { setUnits, setMotion, setQuality, toggleFavorite, clearFavorites, resetAll } = useSettingsStore.getState();

  const [confirming, setConfirming] = useState(false);
  const [didReset, setDidReset] = useState(false);

  const favoriteBodies = favorites.map((id) => getBodyById(id)).filter((b) => b !== undefined);
  const playedKeys = QUIZ_KEYS.filter((k) => quizBest[k]);

  return (
    <>
      <PageHeader eyebrow="Settings" title={<>Make it <span className="brass-text italic">yours</span></>}>
        Preferences stay in your browser. There are no accounts and nothing is sent anywhere.
      </PageHeader>

      <Section>
        <div className="panel space-y-8 p-6 sm:p-8">
          <OptionGroup<UnitSystem>
            legend="Units"
            name="units"
            value={units}
            onChange={setUnits}
            options={[
              { value: 'metric', label: 'Metric', hint: 'km, kg, °C, m/s²' },
              { value: 'imperial', label: 'Imperial', hint: 'miles, lb, °F, ft/s²' },
            ]}
          />
          <OptionGroup<MotionPref>
            legend="Motion"
            name="motion"
            value={motion}
            onChange={setMotion}
            options={[
              { value: 'system', label: 'Follow my device', hint: 'Uses your system setting' },
              { value: 'reduced', label: 'Reduce motion', hint: 'Calmer, starts the 3D scene paused' },
            ]}
          />
          <OptionGroup<QualityPref>
            legend="3D quality"
            name="quality"
            value={quality}
            onChange={setQuality}
            options={[
              { value: 'auto', label: 'Auto', hint: 'Light mode on low-power devices' },
              { value: 'low', label: 'Low', hint: 'Smoother on older phones' },
              { value: 'high', label: 'High', hint: 'Sharper planets' },
            ]}
          />
          <p className="text-xs text-dust">Changes apply immediately and are saved on this device.</p>
        </div>
      </Section>

      <Section eyebrow="Saved on this device" title="Favorites">
        {favoriteBodies.length === 0 ? (
          <p className="panel p-6 text-dust">
            No favorites yet. Use the heart on any planet card or planet page to save it here.
          </p>
        ) : (
          <div className="panel p-6">
            <ul className="divide-y divide-brass/10">
              {favoriteBodies.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 py-3">
                  <Link to={`/planet/${b.slug}`} className="font-display text-lg text-parchment no-underline hover:text-brass-soft">
                    {b.displayName}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(b.id)}
                    className="inline-flex min-h-11 items-center rounded-full border border-brass/30 px-4 text-sm text-dust transition-colors hover:border-ember hover:text-ember"
                    aria-label={`Remove ${b.displayName} from favorites`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-ghost mt-4" onClick={clearFavorites}>
              Clear all favorites
            </button>
          </div>
        )}
      </Section>

      <Section eyebrow="Saved on this device" title="Quiz best scores">
        <div className="panel p-6">
          {playedKeys.length === 0 ? (
            <p className="text-dust">You have not finished a quiz yet.</p>
          ) : (
            <dl className="divide-y divide-brass/10">
              {playedKeys.map((key) => (
                <div key={key} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-sm text-dust">{DIFFICULTY_LABELS[key]}</dt>
                  <dd className="font-display text-lg text-parchment">
                    {quizBest[key]!.score}/{quizBest[key]!.total}
                    <span className="ml-2 font-mono text-xs text-dust">{quizBest[key]!.date}</span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </Section>

      <Section eyebrow="Privacy" title="Your data">
        <div className="panel space-y-4 p-6 sm:p-8">
          <p className="max-w-3xl text-sm leading-relaxed text-dust sm:text-base">
            ORRERA stores your settings, favorites and quiz scores in this browser only (local storage). There
            are no accounts, no tracking and no outside services. Clearing your browser data also clears these.
          </p>

          {!confirming ? (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setDidReset(false);
                setConfirming(true);
              }}
            >
              <Trash2 size={18} aria-hidden="true" /> Reset local data
            </button>
          ) : (
            <div role="alertdialog" aria-label="Confirm reset" className="rounded-2xl border border-ember/50 bg-ember/5 p-4">
              <p className="text-sm text-parchment">
                This removes your units, motion and quality choices, all favorites and every quiz score. It cannot be
                undone.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn !bg-ember !text-[#1a0a04]"
                  onClick={() => {
                    resetAll();
                    setConfirming(false);
                    setDidReset(true);
                  }}
                >
                  Yes, reset everything
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <p role="status" className="text-sm text-brass-soft">
            {didReset ? 'Local data cleared. Everything is back to its defaults.' : ''}
          </p>
        </div>
      </Section>
    </>
  );
}
