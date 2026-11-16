import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, Link, RouterProvider, type RouteObject } from 'react-router-dom';
import { routes } from '@/app/routes';
import { Providers } from '@/app/providers';
import RouteError from '@/pages/RouteError';
import { useSettingsStore } from '@/store/settingsStore';

// jsdom has no WebGL; the explorer's real behaviour is covered in explorer.test.tsx.
vi.mock('@/utils/webgl', () => ({ isWebGLAvailable: vi.fn(() => false) }));

const initialSettings = useSettingsStore.getState();
beforeEach(() => {
  useSettingsStore.setState(initialSettings, true);
  window.localStorage.clear();
});

/** Pages other than Home load on demand, so tests wait for the first heading. */
async function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
  await screen.findByRole('heading', { level: 1 });
  return router;
}

describe('layout', () => {
  it('shows the required footer credit on every page', async () => {
    await renderAt('/');
    const credit = screen.getByText(
      (_, el) => el?.tagName === 'P' && /Built by LAKhan @2026 · All Rights Reserved/.test(el.textContent ?? ''),
    );
    expect(credit).toBeInTheDocument();
  });

  it.each(['/compare', '/facts', '/quiz', '/settings', '/planet/earth', '/nowhere'])(
    'keeps the footer credit on %s',
    async (path) => {
      await renderAt(path);
      expect(screen.getByText(/Built by/i)).toBeInTheDocument();
      expect(screen.getByText(/All Rights Reserved/i)).toBeInTheDocument();
    },
  );

  it('has a skip link and a main landmark', async () => {
    await renderAt('/');
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('opens and closes the mobile menu', async () => {
    await renderAt('/');
    const toggle = screen.getByRole('button', { name: /open menu/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();

    fireEvent.click(toggle);
    const menu = screen.getByRole('navigation', { name: 'Mobile' });
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true');
    expect(within(menu).getByRole('link', { name: 'Quiz' })).toHaveAttribute('href', '/quiz');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();
  });

  it('shows the not-to-scale note on the home page', async () => {
    await renderAt('/');
    expect(screen.getAllByText(/not to scale/i).length).toBeGreaterThan(0);
  });

  it('moves focus to the main area after navigating to another page', async () => {
    const router = await renderAt('/');
    await router.navigate('/compare');
    await screen.findByRole('heading', { level: 1, name: /Weigh one world/i });
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus());
  });
});

describe('home page', () => {
  it('renders the hero heading and both calls to action', async () => {
    await renderAt('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Explore Our Solar System in 3D/i);
    expect(screen.getAllByRole('link', { name: /Launch 3D Explorer/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /Discover the Planets/i })).toBeInTheDocument();
  });

  it('lists all eight planets as links to their pages', async () => {
    await renderAt('/');
    const section = document.getElementById('planets') as HTMLElement;
    const links = within(section).getAllByRole('link');
    expect(links).toHaveLength(8);
    expect(links[2]).toHaveAttribute('href', '/planet/earth');
  });

  it('sets the default document title', async () => {
    await renderAt('/');
    expect(document.title).toBe('ORRERA - A Pocket Solar System');
  });

  it('shows a favorites strip only after a planet is saved, and the strip updates live', async () => {
    await renderAt('/');
    expect(document.getElementById('favorites')).toBeNull();

    const section = document.getElementById('planets') as HTMLElement;
    fireEvent.click(within(section).getByRole('button', { name: 'Add Mars to favorites' }));

    const favorites = document.getElementById('favorites') as HTMLElement;
    expect(within(favorites).getByRole('link', { name: /Mars/ })).toHaveAttribute('href', '/planet/mars');
    expect(within(section).getByRole('button', { name: 'Remove Mars from favorites' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('uses imperial units on the cards when chosen in settings', async () => {
    useSettingsStore.getState().setUnits('imperial');
    await renderAt('/');
    expect(screen.getAllByText(/(million|billion) mi from the Sun/i).length).toBe(8);
  });
});

describe('routes', () => {
  it('renders a planet detail page with units, sources and a title', async () => {
    await renderAt('/planet/earth');
    expect(screen.getByRole('heading', { level: 1, name: 'Earth' })).toBeInTheDocument();
    expect(screen.getByText('12,756 km')).toBeInTheDocument();
    expect(screen.getByText('149.6 million km')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /NASA Planetary Fact Sheet/i })).toBeInTheDocument();
    expect(screen.getByText(/Record last\s+reviewed: 2026-11-12/)).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Earth · ORRERA'));
  });

  it('switches planet page values to imperial units', async () => {
    useSettingsStore.getState().setUnits('imperial');
    await renderAt('/planet/earth');
    expect(screen.getByText('7,926 mi')).toBeInTheDocument();
    expect(screen.getByText('59 °F')).toBeInTheDocument();
  });

  it('saves and un-saves a favorite from the planet page', async () => {
    await renderAt('/planet/venus');
    fireEvent.click(screen.getByRole('button', { name: 'Add Venus to favorites' }));
    expect(useSettingsStore.getState().favorites).toEqual(['venus']);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Venus from favorites' }));
    expect(useSettingsStore.getState().favorites).toEqual([]);
  });

  it('renders the Sun without orbit data', async () => {
    await renderAt('/planet/sun');
    expect(screen.getByRole('heading', { level: 1, name: 'Sun' })).toBeInTheDocument();
    expect(screen.queryByText(/Mean distance from Sun/i)).not.toBeInTheDocument();
  });

  it('shows a not-found state for an invalid planet slug', async () => {
    await renderAt('/planet/pluto-ish');
    expect(screen.getByRole('heading', { level: 1, name: /Object not found/i })).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown route', async () => {
    await renderAt('/definitely-not-a-page');
    expect(screen.getByRole('heading', { level: 1, name: /Lost in space/i })).toBeInTheDocument();
  });

  it.each([
    ['/explore', /3D view is unavailable/i],
    ['/compare', /Weigh one world/i],
    ['/facts', /Small facts/i],
    ['/quiz', /How well do you know/i],
    ['/settings', /Make it/i],
  ])('renders %s', async (path, heading) => {
    await renderAt(path);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(heading);
  });
});

describe('error page', () => {
  it('shows a friendly screen, with the credit, when a page crashes', async () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Boom(): never {
      throw new Error('boom');
    }
    const crashing: RouteObject[] = [
      { path: '/', element: <Link to="/boom">go</Link> },
      { path: '/boom', element: <Boom />, errorElement: <RouteError /> },
    ];
    const router = createMemoryRouter(crashing, { initialEntries: ['/boom'] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole('heading', { level: 1, name: /signal dropped/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload the page/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to home/i })).toHaveAttribute('href', '/');
    expect(screen.getByText(/All Rights Reserved/i)).toBeInTheDocument();
    errors.mockRestore();
  });
});
