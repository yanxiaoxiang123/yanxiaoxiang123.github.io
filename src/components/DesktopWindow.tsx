'use client';

import { useRef, useState } from 'react';
import type { Point } from '@/lib/frame-position';
import { useTransformDrag } from '@/hooks/useTransformDrag';

export default function DesktopWindow({ id, title, initial, z, running, onClose, onFocus, children }: {
  id: string;
  title: string;
  initial: Point;
  z: number;
  running: boolean;
  onClose: () => void;
  onFocus: () => void;
  children: React.ReactNode;
}) {
  const [position, setPosition] = useState(initial);
  const elementRef = useRef<HTMLDivElement>(null);
  const drag = useTransformDrag(elementRef, {
    position, enabled: running,
    bounds: element => ({ minX: 8, minY: 36,
      maxX: Math.max(8, window.innerWidth - element.offsetWidth - 8),
      maxY: Math.max(36, window.innerHeight - 90) }),
    onCommit: setPosition,
  });
  return (
    // Translation belongs to this layer. The inner surface owns the winPop scale animation.
    <div className="os-window-position" ref={elementRef} style={{ zIndex: z }} onPointerDown={onFocus}>
      <div className="os-window" role="dialog" aria-label={title} data-win={id}>
        <div className="os-dragbar" {...drag.handlers} />
        <div className="os-traffic">
          <span className="tl-close" role="button" tabIndex={0} aria-label="关闭"
            onClick={event => { event.stopPropagation(); onClose(); }}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClose(); }
            }} />
          <span className="tl-min" /><span className="tl-max" />
        </div>
        <div className="os-body">{children}</div>
      </div>
    </div>
  );
}
