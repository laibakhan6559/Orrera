import type { ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PageLoading } from '@/components/ui/PageLoading';
import Home from '@/pages/Home';
import RouteError from '@/pages/RouteError';
import NotFound from '@/pages/NotFound';

/** Loads a page's code only when the visitor first opens it. Home stays in the main bundle. */
const lazyPage =
  (load: () => Promise<{ default: ComponentType }>) =>
  async () => ({ Component: (await load()).default });

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    HydrateFallback: PageLoading,
    children: [
      { index: true, element: <Home /> },
      { path: 'explore', lazy: lazyPage(() => import('@/pages/Explorer')) },
      { path: 'globe', lazy: lazyPage(() => import('@/pages/Globe')) },
      { path: 'planet/:slug', lazy: lazyPage(() => import('@/pages/PlanetDetail')) },
      { path: 'compare', lazy: lazyPage(() => import('@/pages/Compare')) },
      { path: 'facts', lazy: lazyPage(() => import('@/pages/Facts')) },
      { path: 'quiz', lazy: lazyPage(() => import('@/pages/Quiz')) },
      { path: 'settings', lazy: lazyPage(() => import('@/pages/Settings')) },
      { path: '*', element: <NotFound /> },
    ],
  },
];
