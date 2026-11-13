'use client';

import { useRef, useState } from 'react';
import { useTransformDrag } from '@/hooks/useTransformDrag';
import type { Point } from '@/lib/frame-position';
import { usePageActivity } from './PageActivity';

const ORIGIN: Point = { x: 0, y: 0 };

/** The outer layer owns drag translation; the image keeps its authored rotation. */
export default function Sticker({ src, alt, size, rotate = 0, style, running: overrideRunning }: {
  src: string;
  alt: string;
  size: number;
  rotate?: number;
  style?: Omit<React.CSSProperties, 'transform'>;
  running?: boolean;
}) {
  const activity = usePageActivity();
  const running = overrideRunning ?? activity.running;
  const [position, setPosition] = useState(ORIGIN);
  const elementRef = useRef<HTMLSpanElement>(null);
  const drag = useTransformDrag(elementRef, {
    position, enabled: running, returnToOrigin: true, onCommit: setPosition,
  });
  return (
    <span className="sticker" ref={elementRef} {...drag.handlers} style={{ ...style, width: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="sticker-image" src={src} alt={alt} draggable={false}
        style={{ transform: `rotate(${rotate}deg)` }} />
    </span>
  );
}
