import { beforeEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { useSettingsStore } from '@/store/settingsStore';
import { renderApp } from './renderApp';

vi.mock('@/utils/webgl', () => ({ isWebGLAvailable: vi.fn(() => false) }));

const initial = useSettingsStore.getState();
beforeEach(() => {
  useSettingsStore.setState(initial, true);
  window.localStorage.clear();
});

describe('accessibility (axe)', () => {
  it.each(['/', '/planet/earth', '/planet/sun', '/compare', '/facts', '/quiz', '/settings', '/explore', '/globe', '/nowhere'])(
    'has no violations on %s',
    async (path) => {
      await renderApp(path);
      const results = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`)).toEqual([]);
    },
  );
});
