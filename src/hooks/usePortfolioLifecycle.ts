'use client';

import { useCallback, useReducer, useSyncExternalStore } from 'react';
import type { TabId } from '@/data/navigation';
import { initialPortfolioState, portfolioReducer } from '@/lib/portfolio-state';
import { usePausableTimeout } from './usePausableTimeout';

const noopSubscribe = () => () => {};
const client = () => true;
const server = () => false;
const visible = () => document.visibilityState === 'visible';
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const subscribeVisibility = (notify: () => void) => {
  document.addEventListener('visibilitychange', notify);
  return () => document.removeEventListener('visibilitychange', notify);
};
const subscribeMotion = (notify: () => void) => {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};

export function usePortfolioLifecycle() {
  const enhanced = useSyncExternalStore(noopSubscribe, client, server);
  const documentVisible = useSyncExternalStore(subscribeVisibility, visible, server);
  const reducedMotion = useSyncExternalStore(subscribeMotion, reduceMotion, client);
  const [state, dispatch] = useReducer(portfolioReducer, initialPortfolioState);
  const canRun = (tab: TabId) => enhanced && documentVisible && state.currentTab === tab && !state.navigation;
  const homeRunning = canRun('home');

  usePausableTimeout(() => {
    if (state.navigation) dispatch({ type: 'commit-navigation', id: state.navigation.id });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, state.navigation ? (reducedMotion ? 0 : 220) : null,
  enhanced && documentVisible, state.navigation?.id ?? 'no-navigation');

  usePausableTimeout(() => {
    dispatch({ type: state.phase === 'zooming' ? 'cover' : 'desktop', attempt: state.attempt });
    if (state.phase === 'covered') window.scrollTo({ top: 0, behavior: 'instant' });
  }, state.phase === 'zooming' ? (reducedMotion ? 0 : 1200)
    : state.phase === 'covered' ? (reducedMotion ? 0 : 600) : null,
  homeRunning, `${state.attempt}:${state.phase}`);

  const switchTab = useCallback((target: TabId) => {
    dispatch({ type: 'navigate', target });
    if (target === state.currentTab) {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
    }
  }, [state.currentTab, reducedMotion]);
  const launch = useCallback(() => {
    dispatch({ type: 'start' });
  }, []);
  const restart = useCallback(() => {
    dispatch({ type: 'restart' });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return { state, dispatch, enhanced, documentVisible, reducedMotion, canRun,
    switchTab, launch, restart };
}
