'use client';

import { memo, useRef, useState } from 'react';
import type { Point } from '@/lib/frame-position';
import { useTransformDrag } from '@/hooks/useTransformDrag';

/** Coordinates belong to this icon, not the desktop's high-level window state. */
export default memo(function DesktopIcon({ id, label, image, repository = false, initial, area, running, onOpen, onEvent }: {
  id: string;
  label: string;
  image: string;
  repository?: boolean;
  initial: Point;
  area: { w: number; h: number };
  running: boolean;
  onOpen: () => void;
  onEvent: (kind: 'drag' | 'drop') => void;
}) {
  const [moved, setMoved] = useState<Point | null>(null);
  const elementRef = useRef<HTMLButtonElement>(null);
  const drag = useTransformDrag(elementRef, {
    position: moved ?? initial,
    enabled: running && area.w > 0,
    bounds: () => ({ minX: 0, minY: 0,
      maxX: Math.max(0, area.w - 90), maxY: Math.max(0, area.h - 110) }),
    onCommit: setMoved,
    onStart: () => onEvent('drag'),
    onEnd: didMove => { if (didMove) onEvent('drop'); },
  });
  return (
    <button ref={elementRef} {...drag.handlers} type="button" data-icon-id={id}
      className={`dicon${repository ? ' dicon-repo' : ''}`}
      style={{ visibility: area.w ? 'visible' : 'hidden' }} disabled={!running}
      onClick={event => {
        event.stopPropagation();
        if (event.detail !== 0 && drag.consumeDragClick()) return;
        onOpen();
      }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={repository ? 'dicon-repo-img' : 'dicon-img'} src={image} alt="" draggable={false} />
      <span className="dicon-label">{label}</span>
    </button>
  );
});
