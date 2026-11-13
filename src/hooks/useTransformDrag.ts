'use client';

import { useCallback, useLayoutEffect, useRef, type RefObject } from 'react';
import { createFramePositionWriter, type Point } from '@/lib/frame-position';

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };
type EndReason = 'up' | 'cancel' | 'disabled';
type Sample = { pointerId: number; clientX: number; clientY: number };
type Options<T extends HTMLElement> = {
  position: Point;
  enabled: boolean;
  bounds?: (element: T) => Bounds;
  threshold?: number;
  returnToOrigin?: boolean;
  onCommit: (point: Point) => void;
  onStart?: () => void;
  onEnd?: (moved: boolean, reason: EndReason) => void;
};
type Session = {
  pointerId: number;
  start: Point;
  origin: Point;
  latest: Point;
  moved: boolean;
  capture: HTMLElement;
  bounds?: Bounds;
  detach: () => void;
};

/**
 * Style ownership: this hook alone writes the target's transform/data-dragging.
 * React owns committed coordinates and other styles. Put rotation/scale on a child.
 */
export function useTransformDrag<T extends HTMLElement>(ref: RefObject<T | null>, options: Options<T>) {
  const { x, y } = options.position;
  const optionsRef = useRef(options);
  const session = useRef<Session | null>(null);
  const writer = useRef<ReturnType<typeof createFramePositionWriter> | null>(null);
  const suppressClick = useRef(false);
  useLayoutEffect(() => { optionsRef.current = options; });

  const release = (drag: Session) => {
    drag.detach();
    try {
      if (drag.capture.hasPointerCapture(drag.pointerId)) drag.capture.releasePointerCapture(drag.pointerId);
    } catch { /* A removed handle may already have lost capture. */ }
  };

  const finish = useCallback((reason: EndReason) => {
    const drag = session.current;
    if (!drag) return;
    session.current = null; // lostpointercapture must not finish the same session twice.
    const current = optionsRef.current;
    const point = current.returnToOrigin || !drag.moved ? current.position : drag.latest;
    writer.current?.sync(point); // Flush before React commits, including a final unpainted sample.
    ref.current?.removeAttribute('data-dragging');
    suppressClick.current = drag.moved;
    release(drag);
    if (drag.moved) current.onCommit(point);
    current.onEnd?.(drag.moved, reason);
  }, [ref]);

  const update = useCallback((sample: Sample) => {
    const drag = session.current;
    if (!drag || sample.pointerId !== drag.pointerId) return;
    const dx = sample.clientX - drag.start.x;
    const dy = sample.clientY - drag.start.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < (optionsRef.current.threshold ?? 4)) return;
    drag.moved = true;
    let x = drag.origin.x + dx;
    let y = drag.origin.y + dy;
    if (drag.bounds) {
      x = Math.max(drag.bounds.minX, Math.min(drag.bounds.maxX, x));
      y = Math.max(drag.bounds.minY, Math.min(drag.bounds.maxY, y));
    }
    drag.latest = { x, y };
    writer.current?.schedule(drag.latest);
  }, []);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const frames = createFramePositionWriter(point => {
      element.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
    }, { request: callback => requestAnimationFrame(callback), cancel: id => cancelAnimationFrame(id) });
    writer.current = frames;
    return () => {
      frames.cancel();
      const drag = session.current;
      session.current = null;
      if (drag) release(drag);
      writer.current = null;
    };
  }, [ref]);

  useLayoutEffect(() => {
    if (!session.current) writer.current?.sync({ x, y });
  }, [x, y]);
  useLayoutEffect(() => {
    if (!options.enabled) finish('disabled');
  }, [options.enabled, finish]);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    const element = ref.current;
    const current = optionsRef.current;
    if (!element || !current.enabled || session.current || !event.isPrimary || event.button !== 0) return;
    suppressClick.current = false;
    const capture = event.currentTarget;
    const pointerId = event.pointerId;
    const onUp = (sample: PointerEvent) => {
      if (session.current?.pointerId !== sample.pointerId) return;
      update(sample);
      finish('up');
    };
    const onCancel = (sample: PointerEvent) => {
      if (session.current?.pointerId === sample.pointerId) finish('cancel');
    };
    const onBlur = () => finish('cancel');
    const onVisibility = () => { if (document.hidden) finish('cancel'); };
    session.current = {
      pointerId, start: { x: event.clientX, y: event.clientY }, origin: current.position,
      latest: current.position, moved: false, capture, bounds: current.bounds?.(element),
      detach: () => {
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        window.removeEventListener('blur', onBlur);
        document.removeEventListener('visibilitychange', onVisibility);
      },
    };
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    try { capture.setPointerCapture(pointerId); } catch { /* Synthetic pointers cannot be captured. */ }
    element.setAttribute('data-dragging', 'true');
    current.onStart?.();
  };
  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    if (session.current?.pointerId !== event.pointerId) return;
    update(event);
    finish('up');
  };
  const onPointerCancel = (event: React.PointerEvent<HTMLElement>) => {
    if (session.current?.pointerId === event.pointerId) finish('cancel');
  };
  return {
    handlers: { onPointerDown, onPointerMove: update, onPointerUp, onPointerCancel,
      onLostPointerCapture: onPointerCancel },
    consumeDragClick() { const suppressed = suppressClick.current; suppressClick.current = false; return suppressed; },
  };
}
