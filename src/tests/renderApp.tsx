import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/app/routes';
import { Providers } from '@/app/providers';

/**
 * Renders the whole app at a path. Pages other than Home load on demand,
 * so this waits for the page's first heading before returning.
 */
export async function renderApp(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
  await screen.findByRole('heading', { level: 1 });
  return router;
}
