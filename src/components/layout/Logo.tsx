import { Link } from 'react-router-dom';

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="28" fill="none" stroke="#8f6b30" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#d6a95b" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="6" fill="#f0d49a" />
      <circle cx="60" cy="32" r="3.5" fill="#d6a95b" />
      <circle cx="19.4" cy="16.2" r="2.8" fill="#f0d49a" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link
      to="/"
      aria-label="ORRERA home"
      className="group inline-flex items-center gap-3 rounded-lg no-underline"
    >
      <span className="transition-transform duration-500 group-hover:rotate-90">
        <LogoMark />
      </span>
      <span className="font-display text-xl font-semibold tracking-[0.32em] text-parchment">
        ORRERA
      </span>
    </Link>
  );
}
