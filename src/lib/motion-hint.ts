type HintScheduler = {
  set: (callback: () => void, delay: number) => number;
  clear: (id: number) => void;
};

/** A short composition hint, owned by the motion that needs it. Never runs an idle loop. */
export function createMotionHint(setActive: (active: boolean) => void, scheduler: HintScheduler) {
  let active = false;
  let pending: number | null = null;
  let generation = 0;

  const clear = () => {
    generation++;
    if (pending !== null) scheduler.clear(pending);
    pending = null;
    if (active) { active = false; setActive(false); }
  };

  return {
    pulse() {
      if (!active) { active = true; setActive(true); }
      if (pending !== null) scheduler.clear(pending);
      const token = ++generation;
      pending = scheduler.set(() => {
        if (token !== generation) return;
        pending = null;
        active = false;
        setActive(false);
      }, 180);
    },
    clear,
  };
}

export const browserHintScheduler: HintScheduler = {
  set: (callback, delay) => window.setTimeout(callback, delay),
  clear: id => window.clearTimeout(id),
};
