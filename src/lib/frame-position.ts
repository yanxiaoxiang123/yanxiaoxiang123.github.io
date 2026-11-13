export type Point = { x: number; y: number };
export type FrameScheduler = { request: (callback: () => void) => number; cancel: (id: number) => void };

/** Coalesce pointer samples; sync/cancel also invalidate an already queued frame. */
export function createFramePositionWriter(write: (point: Point) => void, scheduler: FrameScheduler) {
  let pending: number | null = null;
  let latest: Point | null = null;
  let generation = 0;
  const cancel = () => {
    generation += 1;
    if (pending !== null) scheduler.cancel(pending);
    pending = null;
    latest = null;
  };
  return {
    schedule(point: Point) {
      latest = point;
      if (pending !== null) return;
      const token = generation;
      pending = scheduler.request(() => {
        if (token !== generation) return;
        pending = null;
        if (latest) write(latest);
      });
    },
    sync(point: Point) {
      cancel();
      write(point);
    },
    cancel,
  };
}
