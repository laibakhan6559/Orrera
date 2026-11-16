import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight, Brain, Lightbulb, Orbit, Scale } from 'lucide-react';
import { facts, planets, quizQuestions } from '@/data';
import { OrreryHero } from '@/components/home/OrreryHero';
import { PlanetCard } from '@/components/planets/PlanetCard';
import { Section } from '@/components/ui/PageShell';
import { useSettingsStore } from '@/store/settingsStore';
import { usePageTitle } from '@/utils/usePageTitle';

const features = [
  {
    to: '/explore',
    icon: Orbit,
    title: '3D Explorer',
    text: 'Fly around the Sun and the eight planets, then focus on any world.',
  },
  {
    to: '/compare',
    icon: Scale,
    title: 'Compare Worlds',
    text: 'Put planets side by side: size, mass, gravity, distance and more.',
  },
  {
    to: '/facts',
    icon: Lightbulb,
    title: 'Space Facts',
    text: 'A curated library of facts, each with a source and review date.',
  },
  {
    to: '/quiz',
    icon: Brain,
    title: 'Test Your Knowledge',
    text: 'Quick quizzes with explanations, from beginner to advanced.',
  },
];

export default function Home() {
  usePageTitle();
  const favoriteIds = useSettingsStore((s) => s.favorites);
  const favoritePlanets = planets.filter((p) => favoriteIds.includes(p.id));
  const stats = [
    { label: 'Planets', value: planets.length },
    { label: 'Space facts', value: facts.length },
    { label: 'Quiz questions', value: quizQuestions.length },
    { label: 'External APIs', value: 0 },
  ];

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-10 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <m.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <p className="eyebrow">A pocket solar system</p>
          <h1 className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-balance text-parchment sm:text-6xl lg:text-[3.85rem] xl:text-[4.1rem]">
            Explore Our Solar System <span className="brass-text italic">in 3D</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-dust sm:text-lg">
            Meet the Sun and the eight planets, compare their worlds, read sourced space facts and
            test what you know. It all runs in your browser: no accounts, no tracking, no waiting
            on a server.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/explore" className="btn btn-primary">
              Launch 3D Explorer <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link to="/#planets" className="btn btn-ghost">
              Discover the Planets
            </Link>
          </div>

          <p className="mt-6 font-mono text-xs tracking-wide text-dust">
            3D visualization not to scale · Animation is illustrative
          </p>
        </m.div>

        <m.div
          className="float-slow mx-auto w-full max-w-[34rem]"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
        >
          <OrreryHero />
        </m.div>
      </section>

      {/* Stats supported by the local data */}
      <section aria-label="At a glance" className="mx-auto max-w-6xl px-4 sm:px-6">
        <dl className="panel grid grid-cols-2 divide-brass/15 sm:grid-cols-4 sm:divide-x">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-5 text-center">
              <dd className="font-display text-4xl font-semibold text-brass-soft">{s.value}</dd>
              <dt className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-dust">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Planet strip */}
      <Section id="planets" eyebrow="The eight worlds" title="From scorched Mercury to icy Neptune" className="pt-20">
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {planets.map((p) => (
            <li key={p.id} className="contents">
              <PlanetCard planet={p} />
            </li>
          ))}
        </ul>
      </Section>

      {/* Favorites (only when the visitor has saved some) */}
      {favoritePlanets.length > 0 && (
        <Section id="favorites" eyebrow="Saved on this device" title="Your favorites">
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {favoritePlanets.map((p) => (
              <li key={p.id} className="contents">
                <PlanetCard planet={p} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Features */}
      <Section eyebrow="Learn your way" title="Four ways in">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ to, icon: Icon, title, text }) => (
            <li key={to} className="contents">
              <Link
                to={to}
                className="group panel flex flex-col p-6 no-underline transition duration-300 hover:-translate-y-1 hover:border-brass/60"
              >
                <span className="grid size-11 place-items-center rounded-full border border-brass/40 bg-brass/10 text-brass-soft">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-parchment">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-dust">{text}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brass transition-all group-hover:gap-2.5">
                  Open <ArrowRight size={15} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* Scientific honesty */}
      <Section>
        <aside className="panel p-6 sm:p-8">
          <p className="eyebrow">A note on scale</p>
          <h2 className="mt-3 font-display text-2xl font-semibold text-parchment sm:text-3xl">
            An orrery, not an observatory
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-dust sm:text-base">
            In real life the planets are tiny compared with the distances between them, so a true
            to scale model would show almost nothing. ORRERA compresses distances and adjusts
            sizes so every world stays visible, and its animations show the idea of orbiting, not
            real positions. The facts and measurements on each planet page keep their real values
            and cite where they came from.
          </p>
        </aside>
      </Section>
    </>
  );
}
