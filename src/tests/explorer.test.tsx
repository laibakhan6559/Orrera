import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/app/routes';
import { Providers } from '@/app/providers';
import { MAX_SPEED, MIN_SPEED, useExplorerStore } from '@/store/explorerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { isWebGLAvailable } from '@/utils/webgl';

// jsdom has no WebGL, so the real 3D canvas is replaced with a stub that reports "ready".
vi.mock('@/components/explorer/ExplorerCanvas', async () => {
  const { useEffect } = await import('react');
  return {
    default: function CanvasStub({ onReady }: { onReady: () => void }) {
      useEffect(() => {
        onReady();
      }, [onReady]);
      return <div data-testid="canvas-stub" />;
    },
  };
});
vi.mock('@/utils/webgl', () => ({ isWebGLAvailable: vi.fn(() => true) }));

const initialState = useExplorerStore.getState();
const initialSettings = useSettingsStore.getState();

beforeEach(() => {
  useExplorerStore.setState(initialState, true);
  useSettingsStore.setState(initialSettings, true);
  window.localStorage.clear();
  vi.mocked(isWebGLAvailable).mockReturnValue(true);
});

async function renderExplorer(path = '/explore') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
  await screen.findByRole('toolbar', { name: 'Scene controls' });
  await screen.findByTestId('canvas-stub');
  return router;
}

const desktopList = () => screen.getByRole('complementary', { name: 'Solar System objects' });

describe('explorer page', () => {
  it('shows the canvas, the 9 objects, controls and the scale note', async () => {
    await renderExplorer();
    expect(screen.getByRole('heading', { level: 1, name: '3D Explorer' })).toBeInTheDocument();
    expect(within(desktopList()).getAllByRole('button')).toHaveLength(9);
    expect(screen.getByRole('toolbar', { name: 'Scene controls' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByText(/Not to scale/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });

  it('starts in the overview with no info panel', async () => {
    await renderExplorer();
    expect(screen.queryByRole('region', { name: /^Selected:/ })).not.toBeInTheDocument();
    expect(useExplorerStore.getState().selectedId).toBeNull();
  });

  it('opens an info panel with real values when an object is chosen, and closes it again', async () => {
    await renderExplorer();
    fireEvent.click(within(desktopList()).getByRole('button', { name: /^Earth/ }));

    const panel = screen.getByRole('region', { name: 'Selected: Earth' });
    expect(within(panel).getByText('12,756 km')).toBeInTheDocument();
    expect(within(panel).getByText('149.6 million km')).toBeInTheDocument();
    expect(useExplorerStore.getState().selectedId).toBe('earth');
    expect(within(desktopList()).getByRole('button', { name: /^Earth/ })).toHaveAttribute('aria-current', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Close details' }));
    expect(screen.queryByRole('region', { name: /^Selected:/ })).not.toBeInTheDocument();
    expect(useExplorerStore.getState().selectedId).toBeNull();
  });

  it('links the panel to the full planet page', async () => {
    await renderExplorer();
    fireEvent.click(within(desktopList()).getByRole('button', { name: /^Mars/ }));
    expect(screen.getByRole('link', { name: /Full details/i })).toHaveAttribute('href', '/planet/mars');
  });

  it('shows the Sun without orbit rows', async () => {
    await renderExplorer();
    fireEvent.click(within(desktopList()).getByRole('button', { name: /^Sun/ }));
    const panel = screen.getByRole('region', { name: 'Selected: Sun' });
    expect(within(panel).queryByText(/Mean distance from Sun/i)).not.toBeInTheDocument();
    expect(within(panel).getByText('1,391,400 km')).toBeInTheDocument();
  });

  it('pauses and resumes the animation', async () => {
    await renderExplorer();
    const pause = screen.getByRole('button', { name: 'Pause animation' });
    expect(pause).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(pause);
    expect(useExplorerStore.getState().playing).toBe(false);
    const play = screen.getByRole('button', { name: 'Play animation' });
    expect(play).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(play);
    expect(useExplorerStore.getState().playing).toBe(true);
  });

  it('changes the animation speed', async () => {
    await renderExplorer();
    fireEvent.change(screen.getByRole('combobox', { name: 'Animation speed' }), { target: { value: '5' } });
    expect(useExplorerStore.getState().speed).toBe(5);
  });

  it('toggles orbits and labels', async () => {
    await renderExplorer();
    const orbits = screen.getByRole('button', { name: 'Show orbits' });
    const labels = screen.getByRole('button', { name: 'Show labels' });
    expect(orbits).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(orbits);
    fireEvent.click(labels);
    expect(useExplorerStore.getState().showOrbits).toBe(false);
    expect(useExplorerStore.getState().showLabels).toBe(false);
    expect(orbits).toHaveAttribute('aria-pressed', 'false');
  });

  it('resets the view: clears the selection and signals the camera', async () => {
    await renderExplorer();
    fireEvent.click(within(desktopList()).getByRole('button', { name: /^Jupiter/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset view' }));
    const state = useExplorerStore.getState();
    expect(state.selectedId).toBeNull();
    expect(state.resetNonce).toBe(1);
  });

  it('clears the selection with Escape', async () => {
    await renderExplorer();
    fireEvent.click(within(desktopList()).getByRole('button', { name: /^Venus/ }));
    expect(useExplorerStore.getState().selectedId).toBe('venus');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useExplorerStore.getState().selectedId).toBeNull();
  });

  it('preselects the object named in ?focus= and ignores unknown names', async () => {
    await renderExplorer('/explore?focus=saturn');
    expect(screen.getByRole('region', { name: 'Selected: Saturn' })).toBeInTheDocument();
  });

  it('ignores an unknown ?focus= value', async () => {
    await renderExplorer('/explore?focus=atlantis');
    expect(useExplorerStore.getState().selectedId).toBeNull();
  });
});

describe('mobile drawer', () => {
  it('opens the object list, picks a world and closes', async () => {
    await renderExplorer();
    const opener = screen.getByRole('button', { name: 'Objects' });
    expect(opener).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(opener);
    const drawer = screen.getByRole('dialog', { name: 'Solar System objects' });
    fireEvent.click(within(drawer).getByRole('button', { name: /^Neptune/ }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useExplorerStore.getState().selectedId).toBe('neptune');
  });

  it('closes on Escape without clearing the selection', async () => {
    await renderExplorer('/explore?focus=earth');
    fireEvent.click(screen.getByRole('button', { name: 'Objects' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useExplorerStore.getState().selectedId).toBe('earth');
  });
});

describe('fallback', () => {
  it('lists every world as a normal link when WebGL is unavailable', async () => {
    vi.mocked(isWebGLAvailable).mockReturnValue(false);
    const router = createMemoryRouter(routes, { initialEntries: ['/explore'] });
    render(
      <Providers>
        <RouterProvider router={router} />
      </Providers>,
    );
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/3D view is unavailable/i);
    expect(screen.queryByTestId('canvas-stub')).not.toBeInTheDocument();
    const main = screen.getByRole('main');
    const links = within(main).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toContain('/planet/earth');
    expect(links).toHaveLength(9);
  });
});

describe('explorer store', () => {
  it('clamps speed and ignores invalid values', () => {
    const { setSpeed } = useExplorerStore.getState();
    setSpeed(1000);
    expect(useExplorerStore.getState().speed).toBe(MAX_SPEED);
    setSpeed(0);
    expect(useExplorerStore.getState().speed).toBe(MIN_SPEED);
    setSpeed(2);
    setSpeed(Number.NaN);
    expect(useExplorerStore.getState().speed).toBe(2);
  });
});

describe('planet page link', () => {
  it('offers a "View in 3D" link that focuses that planet', async () => {
    const router = createMemoryRouter(routes, { initialEntries: ['/planet/uranus'] });
    render(
      <Providers>
        <RouterProvider router={router} />
      </Providers>,
    );
    expect(await screen.findByRole('link', { name: /View Uranus in 3D/i })).toHaveAttribute(
      'href',
      '/explore?focus=uranus',
    );
  });
});
