import { useEffect } from 'react';

export const SITE_TITLE = 'ORRERA - A Pocket Solar System';

/** Sets the browser tab title. Pass nothing for the default site title. */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ORRERA` : SITE_TITLE;
  }, [title]);
}
