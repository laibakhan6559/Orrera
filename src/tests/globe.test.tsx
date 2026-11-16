import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { bodies } from '@/data';
import { moon } from '@/data/moon';
import { validateBodies } from '@/utils/dataValidation';
import { MAX_ZOOM, MIN_ZOOM, clampDistance, describeRotation, findGlobeBody, globeBodies, startDistance } from '@/utils/globe';
import { useSettingsStore } from '@/store/settingsStore';
import { isWebGLAvailable } from '@/utils/webgl';
import { renderApp } from './renderApp';

// jsdom has no WebGL, so the canvas is a stub that records what the page asks of it.
const lastProps: { current: Record<string, unknown> } = { current: {} };
vi.mock('@/components/globe/GlobeCanvas', async () => {
  const { useEffect } = await import('react');
  return {
    default: function Stub(props: { onReady: () => void } & Record<string, unknown>) {
      lastProps.current = props;
      useEffect(() => {
        props.onReady();
      }, [props]);
      return <div data-testid="globe-stub" />;
    },
  };
});
vi.mock('@/utils/webgl', () => ({ isWebGLAvailable: vi.fn(() => true) }));

const initial = useSettingsStore.getState();
beforeEach(() => {
  useSettingsStore.setState(initial, true);
  window.localStorage.clear();
  vi.mocked(isWebGLAvailable).mockReturnValue(true);
});

describe('globe data and helpers', () => {
  it('lists the Sun, eight planets and the Moon', () => {
    expect(globeBodies.map((b) => b.id)).toEqual([
      'sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'moon',
    ]);
  });

  it('has a valid, sourced Moon record that stays out of the planet list', () => {
    expect(validateBodies([...bodies, moon])).toEqual([]);
    expect(bodies.map((b) => b.id)).not.toContain('moon');
    expect(moon.physical.equatorialDiameterKm).toBe(3475);
    expect(moon.rotation?.siderealPeriodHours).toBeCloseTo(655.72);
  });

  it('falls back to Earth for an unknown name', () => {
    expect(findGlobeBody('atlantis').id).toBe('earth');
    expect(findGlobeBody(null).id).toBe('earth');
    expect(findGlobeBody('moon').id).toBe('moon');
  });

  it('keeps zoom within limits', () => {
    expect(clampDistance(0.1)).toBe(MIN_ZOOM);
    expect(clampDistance(99)).toBe(MAX_ZOOM);
    expect(clampDistance(4)).toBe(4);
  });

  it('starts further back for ringed planets and for narrow screens', () => {
    expect(startDistance(true)).toBeGreaterThan(startDistance(false));
    expect(startDistance(false, 0.46)).toBeGreaterThan(startDistance(false, 1.6));
    expect(startDistance(true, 0.46)).toBeGreaterThan(startDistance(true, 1.6));
  });

  it('describes real rotation periods in plain words', () => {
    expect(describeRotation(23.9)).toBe('23.9 hours');
    expect(describeRotation(-5832.5)).toBe('243 days (spins backwards)');
    expect(describeRotation(655.72)).toBe('27 days');
    expect(describeRotation(null)).toBe('Not in this dataset');
  });
});

describe('globe page', () => {
  it('opens on Earth with the picker, controls and real facts', async () => {
    await renderApp('/globe');
    expect(screen.getByRole('heading', { level: 1, name: 'Earth in 360°' })).toBeInTheDocument();
    const picker = screen.getByRole('navigation', { name: 'Choose an object' });
    expect(within(picker).getAllByRole('button')).toHaveLength(10);
    expect(within(picker).getByRole('button', { name: 'Earth' })).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByTestId('globe-stub')).toBeInTheDocument();
    expect(screen.getByText('23.9 hours')).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Viewer controls' })).toBeInTheDocument();
    expect(document.title).toBe('Earth in 360° · ORRERA');
  });

  it('switches object and updates the address', async () => {
    const router = await renderApp('/globe?body=earth');
    fireEvent.click(screen.getByRole('button', { name: 'Moon' }));
    expect(router.state.location.search).toBe('?body=moon');
    expect(screen.getByRole('heading', { level: 2, name: 'Moon' })).toBeInTheDocument();
    expect(screen.getByText(/one face always points at Earth/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /About Earth/ })).toHaveAttribute('href', '/planet/earth');
  });

  it('says Venus spins backwards', async () => {
    await renderApp('/globe?body=venus');
    expect(screen.getByText(/243 days \(spins backwards\)/)).toBeInTheDocument();
    expect(screen.getByText(/Sun would rise in the west/i)).toBeInTheDocument();
  });

  it('toggles spin and the axis, and sends zoom and reset commands', async () => {
    await renderApp('/globe');
    await screen.findByTestId('globe-stub');
    expect(lastProps.current.spinning).toBe(true);
    const spin = screen.getByRole('button', { name: 'Spin' });
    expect(spin).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(spin);
    expect(lastProps.current.spinning).toBe(false);
    expect(spin).toHaveAttribute('aria-pressed', 'false');

    expect(lastProps.current.showAxis).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Show spin axis' }));
    expect(lastProps.current.showAxis).toBe(true);

    const before = (lastProps.current.command as { nonce: number }).nonce;
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(lastProps.current.command).toMatchObject({ kind: 'zoom-in', nonce: before + 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(lastProps.current.command).toMatchObject({ kind: 'zoom-out', nonce: before + 2 });
    fireEvent.click(screen.getByRole('button', { name: 'Reset view' }));
    expect(lastProps.current.command).toMatchObject({ kind: 'reset' });
  });

  it('starts still when reduced motion is chosen in settings', async () => {
    useSettingsStore.getState().setMotion('reduced');
    await renderApp('/globe');
    await screen.findByTestId('globe-stub');
    expect(lastProps.current.spinning).toBe(false);
    expect(lastProps.current.reducedMotion).toBe(true);
  });

  it('uses imperial units when chosen', async () => {
    useSettingsStore.getState().setUnits('imperial');
    await renderApp('/globe?body=earth');
    expect(screen.getByText('7,926 mi')).toBeInTheDocument();
  });

  it('shows plain links when WebGL is unavailable', async () => {
    vi.mocked(isWebGLAvailable).mockReturnValue(false);
    await renderApp('/globe');
    expect(screen.getByRole('heading', { level: 1, name: /3D view is unavailable/i })).toBeInTheDocument();
    expect(screen.queryByTestId('globe-stub')).not.toBeInTheDocument();
  });

  it('is linked from the navigation and from planet pages', async () => {
    await renderApp('/planet/mars');
    expect(screen.getAllByRole('link', { name: '360° View' })[0]).toHaveAttribute('href', '/globe');
    expect(screen.getByRole('link', { name: /Rotate Mars 360°/ })).toHaveAttribute('href', '/globe?body=mars');
  });

  it.each(['/globe', '/globe?body=saturn', '/globe?body=moon'])('has no axe violations on %s', async (path) => {
    await renderApp(path);
    await screen.findByTestId('globe-stub');
    const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
  });
});
