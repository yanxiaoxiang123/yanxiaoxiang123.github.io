import type { TabId } from '@/data/navigation';

export type StartupPhase = 'intro' | 'ready' | 'booting' | 'zooming' | 'covered' | 'desktop';
export type PortfolioState = {
  currentTab: TabId;
  visited: Record<TabId, boolean>;
  phase: StartupPhase;
  attempt: number;
  desktopMounted: boolean;
  navigationId: number;
  navigation: { target: TabId; id: number } | null;
};
export type PortfolioAction =
  | { type: 'navigate'; target: TabId }
  | { type: 'commit-navigation'; id: number }
  | { type: 'ready' | 'booted' | 'cover' | 'desktop'; attempt: number }
  | { type: 'start' | 'restart' };

export const initialPortfolioState: PortfolioState = {
  currentTab: 'home', visited: { home: true, works: false, about: false },
  phase: 'intro', attempt: 0, desktopMounted: false, navigationId: 0, navigation: null,
};

/** Current page, retained mounts and startup phases are independent state. */
export function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
  switch (action.type) {
    case 'navigate': {
      const id = state.navigationId + 1;
      return { ...state, navigationId: id,
        navigation: action.target === state.currentTab ? null : { target: action.target, id } };
    }
    case 'commit-navigation': {
      if (!state.navigation || action.id !== state.navigation.id) return state;
      const currentTab = state.navigation.target;
      return { ...state, currentTab, navigation: null,
        visited: { ...state.visited, [currentTab]: true } };
    }
    case 'start':
      return state.phase === 'ready' && state.currentTab === 'home' && !state.navigation
        ? { ...state, phase: 'booting' } : state;
    case 'restart':
      return { ...state, phase: 'intro', attempt: state.attempt + 1 };
    default: {
      if (action.attempt !== state.attempt) return state;
      const transitions = {
        ready: ['intro', 'ready'], booted: ['booting', 'zooming'],
        cover: ['zooming', 'covered'], desktop: ['covered', 'desktop'],
      } as const;
      const [from, to] = transitions[action.type];
      if (state.phase !== from) return state;
      return { ...state, phase: to, desktopMounted: state.desktopMounted || to === 'desktop' };
    }
  }
}
