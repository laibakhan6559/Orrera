import { Link } from 'react-router-dom';
import { Logo } from './Logo';

const explore = [
  { to: '/explore', label: 'Explorer' },
  { to: '/#planets', label: 'Planets' },
  { to: '/compare', label: 'Compare' },
];
const learn = [
  { to: '/facts', label: 'Space facts' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/settings', label: 'Settings' },
];

function FooterLinks({ title, items }: { title: string; items: { to: string; label: string }[] }) {
  return (
    <div>
      <h2 className="eyebrow mb-4">{title}</h2>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="text-sm text-dust no-underline transition-colors hover:text-brass-soft"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-brass/15 bg-ink/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-dust">
            A pocket solar system. Explore the Sun and the eight planets, compare worlds and test
            what you know. No accounts, no tracking, no external APIs.
          </p>
        </div>
        <FooterLinks title="Explore" items={explore} />
        <FooterLinks title="Learn" items={learn} />
      </div>

      <div className="border-t border-brass/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-dust sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="font-mono tracking-wide">
            Built by <span className="text-brass-soft">LAKhan</span> @2026 · All Rights Reserved
          </p>
          <p>
            Educational visualization, not to scale. Animation is illustrative. Data from NASA fact
            sheets.
          </p>
        </div>
      </div>
    </footer>
  );
}
