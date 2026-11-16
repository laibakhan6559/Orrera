import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { useSettingsStore } from '@/store/settingsStore';
import { renderApp } from './renderApp';

vi.mock('@/utils/webgl', () => ({ isWebGLAvailable: vi.fn(() => false) }));

const initial = useSettingsStore.getState();
beforeEach(() => {
  useSettingsStore.setState(initial, true);
  window.localStorage.clear();
});

describe('compare page', () => {
  it('starts with Earth and Mars and updates the address when picking', async () => {
    const router = await renderApp('/compare');
    const earth = screen.getByRole('button', { name: 'Earth' });
    expect(earth).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Venus' }));
    expect(router.state.location.search).toContain('venus');
    expect(screen.getByRole('table')).toHaveTextContent('Venus');
  });

  it('keeps between two and four planets', async () => {
    await renderApp('/compare?p=earth,mars');
    fireEvent.click(screen.getByRole('button', { name: 'Mars' }));
    expect(screen.getByRole('button', { name: 'Mars' })).toHaveAttribute('aria-pressed', 'true');
    for (const n of ['Venus', 'Jupiter', 'Saturn']) fireEvent.click(screen.getByRole('button', { name: n }));
    expect(screen.getByRole('button', { name: 'Saturn' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Jupiter' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows imperial values when chosen', async () => {
    useSettingsStore.getState().setUnits('imperial');
    await renderApp('/compare?p=earth,mars');
    expect(screen.getByText('7,926 mi')).toBeInTheDocument();
  });
});

describe('facts page', () => {
  it('searches and shows an empty state, then clears', async () => {
    await renderApp('/facts');
    const all = screen.getByText(/Showing \d+ of \d+ facts/).textContent;
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzzqqq' } });
    expect(screen.getByText(/No facts match/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Clear search/i }));
    expect(screen.getByText(/Showing \d+ of \d+ facts/).textContent).toBe(all);
  });

  it('filters by topic', async () => {
    await renderApp('/facts');
    const before = screen.getByText(/Showing \d+ of/).textContent;
    const group = screen.getByRole('group', { name: 'Topic' });
    fireEvent.click(within(group).getAllByRole('button')[1]);
    expect(screen.getByText(/Showing \d+ of/).textContent).not.toBe(before);
  });

  it('can show another fact', async () => {
    await renderApp('/facts');
    fireEvent.click(screen.getByRole('button', { name: /Show another fact/i }));
    expect(screen.getByText('Random fact')).toBeInTheDocument();
  });
});

describe('quiz page', () => {
  it('plays a full quiz and saves the best score', async () => {
    await renderApp('/quiz');
    fireEvent.click(screen.getByRole('radio', { name: /Beginner/ }));
    fireEvent.click(screen.getByRole('radio', { name: /5 questions/ }));
    fireEvent.click(screen.getByRole('button', { name: /Start quiz/ }));

    for (let i = 0; i < 5; i++) {
      const list = (await screen.findAllByRole('button')).filter((b) => /^[A-D]/.test(b.textContent ?? '') && b.closest('ul'));
      fireEvent.click(list[0]);
      fireEvent.click(await screen.findByRole('button', { name: /Next|See results|Finish/i }));
    }
    expect(await screen.findByText('Quiz complete')).toBeInTheDocument();
    expect(useSettingsStore.getState().quizBest.beginner?.total).toBe(5);
  });
});

describe('settings page', () => {
  it('changes units and persists them', async () => {
    await renderApp('/settings');
    fireEvent.click(screen.getByRole('radio', { name: /Imperial/ }));
    expect(useSettingsStore.getState().units).toBe('imperial');
  });

  it('asks before resetting, and cancel keeps data', async () => {
    useSettingsStore.getState().toggleFavorite('earth');
    await renderApp('/settings');
    fireEvent.click(screen.getByRole('button', { name: /Reset local data/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(useSettingsStore.getState().favorites).toEqual(['earth']);
    fireEvent.click(screen.getByRole('button', { name: /Reset local data/ }));
    fireEvent.click(screen.getByRole('button', { name: /Yes, reset/ }));
    expect(useSettingsStore.getState().favorites).toEqual([]);
    expect(screen.getByText(/Local data cleared/)).toBeInTheDocument();
  });
});
