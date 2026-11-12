'use client';

import { useRef, useState } from 'react';

/**
 * A draggable sticker that springs back to its original spot when released.
 */
export default function Sticker({
  src,
  alt,
  size,
  rotate = 0,
  style,
}: {
  src: string;
  alt: string;
  size: number;
  rotate?: number;
  style?: React.CSSProperties;
}) {
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const origin = useRef({ x: 0, y: 0 });

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`sticker${dragging ? ' is-dragging' : ''}`}
      style={
        {
          ...style,
          width: size,
          height: 'auto',
          transform: `translate(${off.x}px, ${off.y}px) rotate(${rotate}deg)`,
          zIndex: dragging ? 60 : undefined,
        } as React.CSSProperties
      }
      onPointerDown={(e) => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* synthetic pointer events have no capture target */
        }
        origin.current = { x: e.clientX - off.x, y: e.clientY - off.y };
        setDragging(true);
      }}
      onPointerMove={(e) => {
        if (!dragging) return;
        setOff({ x: e.clientX - origin.current.x, y: e.clientY - origin.current.y });
      }}
      onPointerUp={() => {
        setDragging(false);
        setOff({ x: 0, y: 0 });
      }}
      onPointerCancel={() => {
        setDragging(false);
        setOff({ x: 0, y: 0 });
      }}
    />
  );
}
