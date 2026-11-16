import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Settings as SettingsIcon, X } from 'lucide-react';
import { Logo } from './Logo';

const navItems = [
  { to: '/globe', label: '360° View' },
  { to: '/compare', label: 'Compare' },
  { to: '/facts', label: 'Facts' },
  { to: '/quiz', label: 'Quiz' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-2 text-sm font-medium no-underline transition-colors ${
    isActive ? 'text-brass-soft' : 'text-dust hover:text-parchment'
  }`;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-brass/15 bg-void/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-0.5 whitespace-nowrap md:flex lg:gap-1">
          <Link
            to="/#planets"
            className="rounded-full px-3 py-2 text-sm font-medium text-dust no-underline transition-colors hover:text-parchment"
          >
            Planets
          </Link>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/settings"
            aria-label="Settings"
            className={({ isActive }) =>
              `grid size-10 place-items-center rounded-full transition-colors ${
                isActive ? 'text-brass-soft' : 'text-dust hover:text-parchment'
              }`
            }
          >
            <SettingsIcon size={18} aria-hidden="true" />
          </NavLink>
          <Link to="/explore" aria-label="Launch Explorer" className="btn btn-primary ml-1 !min-h-10 !px-4 !text-sm lg:ml-2 lg:!px-5">
            <span className="lg:hidden">Explorer</span>
            <span className="hidden lg:inline">Launch Explorer</span>
          </Link>
        </nav>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-full border border-brass/30 text-parchment md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t border-brass/15 bg-void/95 px-4 pb-6 pt-4 md:hidden"
        >
          <ul className="mx-auto flex max-w-6xl flex-col gap-1">
            {[
              { to: '/explore', label: 'Launch Explorer' },
              { to: '/#planets', label: 'Planets' },
              ...navItems,
              { to: '/settings', label: 'Settings' },
            ].map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={close}
                  className="flex min-h-12 items-center rounded-xl px-4 text-base font-medium text-parchment no-underline hover:bg-brass/10"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
