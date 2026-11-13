'use client';

import { createContext, useContext, type ReactNode } from 'react';

type Activity = { running: boolean; reducedMotion: boolean };
const PageActivity = createContext<Activity>({ running: false, reducedMotion: true });

/** Server-rendered children stay outside this module's import graph. */
export function PageActivityProvider({ running, reducedMotion, children }: Activity & { children: ReactNode }) {
  return <PageActivity.Provider value={{ running, reducedMotion }}>{children}</PageActivity.Provider>;
}
export const usePageActivity = () => useContext(PageActivity);
