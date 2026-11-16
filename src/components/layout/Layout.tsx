import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/** Scrolls to the top on page change, or to the element named by the URL hash. */
function useScrollOnNavigate() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
}

/** Thin brass bar at the top of the screen while the next page's code is downloading. */
function NavigationProgress() {
  const navigation = useNavigation();
  const busy = navigation.state !== 'idle';
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-brass-soft transition-opacity duration-200 ${
        busy ? 'animate-pulse opacity-100' : 'opacity-0'
      }`}
    />
  );
}

export function Layout() {
  useScrollOnNavigate();

  // After moving to another page, put keyboard and screen-reader focus on the new
  // content (not on first load, and not for same-page hash links).
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="relative flex min-h-dvh flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <NavigationProgress />
      <div className="starfield" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <Navbar />
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
