'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePausableTimeout } from '@/hooks/usePausableTimeout';

export type PetEventKind = 'open' | 'close' | 'drag' | 'drop';
export type PetEvent = { kind: PetEventKind; at: number };

type Mode = 'idle' | 'run-right' | 'run-left' | 'wave' | 'jump' | 'sad' | 'wait' | 'work' | 'review';

const SRC: Record<Mode, string> = {
  idle: '/images/xiaojing/idle.webp',
  'run-right': '/images/xiaojing/run-right.webp',
  'run-left': '/images/xiaojing/run-left.webp',
  wave: '/images/xiaojing/wave.webp',
  jump: '/images/xiaojing/jump.webp',
  sad: '/images/xiaojing/sad.webp',
  wait: '/images/xiaojing/wait.webp',
  work: '/images/xiaojing/work.webp',
  review: '/images/xiaojing/review.webp',
};

const DURATION: Record<Mode, number> = {
  idle: 1100,
  'run-right': 1060,
  'run-left': 1060,
  wave: 700,
  jump: 840,
  sad: 1220,
  wait: 1010,
  work: 820,
  review: 1030,
};

const PET = 150;
const SPEED = 128; // px per second

const CLICK_LINES = [
  '找工作 ing',
  '别催，在写了',
  '今天也在调 bug',
  '点我干嘛～',
  '要看看我的项目吗',
  '面完这家还有下家',
];

const EVENT_LINES: Record<PetEventKind, string[]> = {
  open: ['认真看…', '这页有东西', '翻开看看'],
  close: ['看完啦', '下一个'],
  drag: ['搬到哪儿？', '小心点放'],
  drop: ['好嘞', '就放这儿'],
};

export default function Xiaojing({
  area,
  event,
  running,
  reducedMotion,
}: {
  area: { w: number; h: number };
  event: PetEvent | null;
  running: boolean;
  reducedMotion: boolean;
}) {
  const [mode, setMode] = useState<Mode>('idle');
  const [modeVersion, setModeVersion] = useState(0);
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null);
  const [queuedJump, setQueuedJump] = useState<number | null>(null);

  const petRef = useRef<HTMLDivElement>(null);
  const pausedAt = useRef<number | null>(null);
  const handledEvent = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const dragInfo = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const st = useRef({
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    walking: false,
    busyUntil: 0,
    nextWander: 0,
    drag: false,
    ready: false,
  });

  const say = useCallback((text: string) => {
    setBubble(previous => ({ text, id: (previous?.id ?? 0) + 1 }));
  }, []);

  const play = useCallback(
    (next: Mode, text?: string) => {
      const ms = DURATION[next];
      st.current.walking = false;
      setMode(next);
      st.current.busyUntil = performance.now() + ms;
      if (text) say(text);
      setModeVersion(version => version + 1);
    },
    [say],
  );

  /* Preload every state so switching never shows an empty frame. */
  useEffect(() => {
    Object.values(SRC).forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  usePausableTimeout(() => setBubble(null), bubble ? 2400 : null, running, bubble?.id ?? 'no-bubble');
  const emote = mode !== 'idle' && mode !== 'run-left' && mode !== 'run-right';
  usePausableTimeout(() => { if (!st.current.drag) setMode('idle'); },
    emote ? DURATION[mode] : null, running, modeVersion);
  usePausableTimeout(() => { setQueuedJump(null); play('jump'); },
    queuedJump === null ? null : 760, running, queuedJump ?? 'no-jump');

  usePausableTimeout(() => {
    if (!event || handledEvent.current === event.at) return;
    handledEvent.current = event.at;
    const map: Record<PetEventKind, Mode> = {
      open: 'work',
      close: 'review',
      drag: 'wait',
      drop: 'jump',
    };
    const line = EVENT_LINES[event.kind];
    const text = line[Math.floor(Math.random() * line.length)];
    play(map[event.kind], text);
  }, event ? 0 : null, running, event?.at ?? 'no-event');

  useEffect(() => {
    const pet = petRef.current;
    if (!running || !pet) return;
    const petState = st.current;
    let raf = 0;
    let last = performance.now();
    if (pausedAt.current !== null) {
      const pausedFor = last - pausedAt.current;
      st.current.busyUntil += pausedFor;
      st.current.nextWander += pausedFor;
      pausedAt.current = null;
    }

    const petSize = () => (area.w > 0 && area.w <= 768 ? 112 : PET);

    const bounds = () => {
      const size = petSize();
      const mobile = area.w > 0 && area.w <= 768;
      const iconCol = area.w > 900 ? 320 : 0;
      // On phones the icon grid fills the top of the screen, so keep the pet below it.
      const minY = mobile ? Math.min(270, area.h * 0.4) : 52;
      return {
        minX: 10,
        minY,
        maxX: Math.max(10, area.w - size - iconCol),
        maxY: Math.max(minY, area.h - size - 96),
      };
    };

    const apply = () => {
      pet.style.transform = `translate3d(${st.current.x}px, ${st.current.y}px, 0)`;
    };

    const wander = () => {
      const b = bounds();
      const s = st.current;
      let tx = 0;
      let ty = 0;
      for (let i = 0; i < 6; i += 1) {
        tx = b.minX + Math.random() * (b.maxX - b.minX);
        ty = b.minY + Math.random() * (b.maxY - b.minY);
        if (Math.hypot(tx - s.x, ty - s.y) > 120) break;
      }
      s.tx = tx;
      s.ty = ty;
      s.walking = true;
      setMode(tx >= s.x ? 'run-right' : 'run-left');
    };

    const loop = (now: number) => {
      // Cap only to avoid teleporting after the tab was hidden; keeps pace even
      // when frames arrive slowly.
      const dt = Math.min(260, now - last) / 1000;
      last = now;
      const s = st.current;

      if (!s.ready && area.w > 0) {
        s.x = Math.min(area.w * 0.34, Math.max(10, area.w - petSize() - 360));
        s.y = area.w <= 768 ? Math.min(area.h * 0.62, area.h - petSize() - 96) : area.h * 0.46;
        s.ready = true;
        s.nextWander = now + 2600;
        apply();
      }

      if (s.ready && !s.drag && !reducedMotion) {
        if (s.walking) {
          const dx = s.tx - s.x;
          const dy = s.ty - s.y;
          const dist = Math.hypot(dx, dy);
          const step = SPEED * dt;
          if (dist <= step || dist < 2) {
            s.x = s.tx;
            s.y = s.ty;
            s.walking = false;
            setMode('idle');
            s.nextWander = now + 1600 + Math.random() * 2600;
            if (Math.random() < 0.22) play('wave');
          } else {
            s.x += (dx / dist) * step;
            s.y += (dy / dist) * step;
            apply();
          }
        } else if (now > s.busyUntil && now > s.nextWander) {
          wander();
        }
      }

      if (!reducedMotion) raf = requestAnimationFrame(loop);
    };

    loop(performance.now());
    return () => {
      cancelAnimationFrame(raf);
      pausedAt.current = performance.now();
      petState.drag = false;
      dragInfo.current = null;
    };
  }, [area.w, area.h, play, running, reducedMotion]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    suppressClick.current = false;
    const s = st.current;
    dragInfo.current = { sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y, moved: false };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointer events have no capture target */
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragInfo.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    if (!d.moved) {
      d.moved = true;
      suppressClick.current = true;
      st.current.drag = true;
      st.current.walking = false;
      play('sad', '放我下来…');
    }
    const size = area.w > 0 && area.w <= 768 ? 112 : PET;
    const maxX = Math.max(0, area.w - size);
    const maxY = Math.max(0, area.h - size);
    st.current.x = Math.max(0, Math.min(maxX, d.ox + dx));
    st.current.y = Math.max(0, Math.min(maxY, d.oy + dy));
    if (petRef.current) {
      petRef.current.style.transform = `translate3d(${st.current.x}px, ${st.current.y}px, 0)`;
    }
  };

  const endDrag = () => {
    const d = dragInfo.current;
    if (d?.moved) {
      st.current.drag = false;
      st.current.nextWander = performance.now() + 2200;
      play('jump', '就站这儿');
    }
    dragInfo.current = null;
  };

  const onClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const text = CLICK_LINES[Math.floor(Math.random() * CLICK_LINES.length)];
    play('wave', text);
    setQueuedJump(performance.now());
  };

  return (
    <div
      className="xiaojing"
      ref={petRef}
      role="button"
      tabIndex={0}
      aria-label="小镜，桌面伙伴"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {bubble ? (
        <span className="xiaojing-bubble" aria-hidden="true">
          {bubble.text}
        </span>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SRC[mode]} alt="" draggable={false} />
    </div>
  );
}
