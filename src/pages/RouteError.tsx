import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { usePageTitle } from '@/utils/usePageTitle';

/**
 * Last-resort screen if a page crashes or its code fails to download
 * (for example when the device went offline). Self-contained on purpose:
 * it must not depend on the layout that may be what failed.
 */
export default function RouteError() {
  const error = useRouteError();
  usePageTitle('Something went wrong');

  if (!isRouteErrorResponse(error)) {
    console.error('ORRERA route error:', error);
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-void px-4 py-16 text-center">
      <div className="max-w-md">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-parchment sm:text-5xl">
          The signal dropped
        </h1>
        <p className="mt-5 text-base leading-relaxed text-dust">
          This page could not load. Check your connection and try again, or head back to the start.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload the page
          </button>
          <a href="/" className="btn btn-ghost">
            Back to home
          </a>
        </div>
        <p className="mt-12 font-mono text-xs tracking-wide text-dust">
          Built by <span className="text-brass-soft">LAKhan</span> @2026 · All Rights Reserved
        </p>
      </div>
    </div>
  );
}
