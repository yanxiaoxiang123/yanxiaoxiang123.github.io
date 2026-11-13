'use client';

import { useEffect, useEffectEvent, useMemo } from 'react';
import { createPausableTimeout } from '@/lib/pausable-timeout';

// These browser functions run only when the effect arms or pauses its timer.
const browserScheduler = {
  now: () => performance.now(),
  set: (fn: () => void, ms: number) => window.setTimeout(fn, ms),
  clear: (id: number) => window.clearTimeout(id),
};

/**
 * One-shot task: pause retains remaining time, null cancels, a new key/delay replaces.
 * A completed identity stays completed. Use a new key to run another task.
 */
export function usePausableTimeout(
  callback: () => void,
  delay: number | null,
  running: boolean,
  taskKey: string | number,
) {
  const timer = useMemo(() => createPausableTimeout(browserScheduler), []);
  const onElapsed = useEffectEvent((scheduledKey: string | number, scheduledDelay: number | null) => {
    if (!running || taskKey !== scheduledKey || delay !== scheduledDelay) return false;
    callback();
    return true;
  });

  useEffect(() => () => timer.cancel(), [timer]);
  useEffect(() => {
    timer.configure(delay, taskKey);
    if (running) timer.resume(() => onElapsed(taskKey, delay));
    return () => timer.pause();
  }, [timer, delay, running, taskKey]);
}
