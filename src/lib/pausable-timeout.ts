type TaskKey = string | number;
type Scheduler = {
  now: () => number;
  set: (callback: () => void, delay: number) => number;
  clear: (id: number) => void;
};
type Task = { key: TaskKey; delay: number; remaining: number; completed: boolean };

/** One timeout with explicit pause, replacement and disposal semantics. */
export function createPausableTimeout(scheduler: Scheduler) {
  let task: Task | null = null;
  let pending: { id: number; started: number; wait: number } | null = null;
  let generation = 0;

  const pause = () => {
    generation += 1; // Invalidate even callbacks already removed from the timer queue.
    if (!pending) return;
    scheduler.clear(pending.id);
    if (task) task.remaining = Math.max(0, pending.wait - (scheduler.now() - pending.started));
    pending = null;
  };
  const cancel = () => { pause(); task = null; };

  return {
    configure(delay: number | null, key: TaskKey) {
      if (delay === null) { cancel(); return; }
      if (task?.key === key && task.delay === delay) return;
      pause();
      task = { key, delay, remaining: delay, completed: false };
    },
    resume(callback: () => boolean | void) {
      if (!task || task.completed || pending) return;
      const current = task;
      const token = ++generation;
      const started = scheduler.now();
      const wait = current.remaining;
      const id = scheduler.set(() => {
        if (generation !== token || task !== current) return;
        pending = null;
        current.remaining = 0;
        current.completed = true;
        // A React render may disable the owner before its effect cleanup runs.
        if (callback() === false && task === current) current.completed = false;
      }, wait);
      pending = { id, started, wait };
    },
    pause,
    cancel,
  };
}
