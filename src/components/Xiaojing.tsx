'use client';

import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { usePausableTimeout } from '@/hooks/usePausableTimeout';
import { createPetAssetCache, preparePetImage } from '@/lib/pet-assets';

export type PetEventKind = 'open' | 'close' | 'drag' | 'drop';
export type PetEvent = { kind: PetEventKind; at: number };

type Mode = 'idle' | 'run-right' | 'run-left' | 'wave' | 'jump' | 'sad' | 'wait' | 'work' | 'review';
type Point = { x: number; y: number };
type Action = {
  id: number;
  mode: Mode;
  text?: string;
  target?: Point;
  restDelay?: number;
};
type PlayOptions = Pick<Action, 'target' | 'restDelay'> & {
  followUp?: boolean;
  preserveJump?: boolean;
};

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

// Preparation is shared, but action ownership and cancellation stay with the component.
const assets = createPetAssetCache(preparePetImage);
const PET = 150;
const SPEED = 128; // px per second
const restDelay = () => 1600 + Math.random() * 2600;
const petSize = (width: number) => (width > 0 && width <= 768 ? 112 : PET);

function bounds(area: { w: number; h: number }) {
  const size = petSize(area.w);
  const mobile = area.w > 0 && area.w <= 768;
  const minY = mobile ? Math.min(270, area.h * 0.4) : 52;
  return {
    minX: 10,
    minY,
    maxX: Math.max(10, area.w - size - (area.w > 900 ? 320 : 0)),
    maxY: Math.max(minY, area.h - size - 96),
  };
}

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
  const [action, setAction] = useState<Action>({ id: 0, mode: 'idle' });
  const [shown, setShown] = useState<Action | null>(null);
  const [bubble, setBubble] = useState<{ text: string; id: number } | null>(null);
  const [queuedJump, setQueuedJump] = useState<{ id: number; started: boolean } | null>(null);
  const [wander, setWander] = useState<{ id: number; delay: number } | null>({ id: 0, delay: 2600 });
  const [walkTarget, setWalkTarget] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);

  const petRef = useRef<HTMLDivElement>(null);
  const actionSequence = useRef(0);
  const waitSequence = useRef(0);
  const handledEvent = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const dragInfo = useRef<{
    sx: number; sy: number; ox: number; oy: number; moved: boolean;
    pointerId: number; element: HTMLDivElement;
  } | null>(null);
  const st = useRef({ x: 0, y: 0, drag: false, ready: false });

  const say = useCallback((text: string) => {
    setBubble(previous => ({ text, id: (previous?.id ?? 0) + 1 }));
  }, []);

  const waitToWander = useCallback((delay: number) => {
    setWander({ id: ++waitSequence.current, delay });
  }, []);

  const play = useCallback((next: Mode, text?: string, options: PlayOptions = {}) => {
    const id = ++actionSequence.current;
    setWalkTarget(null);
    setWander(null);
    setAction({ id, mode: next, text, target: options.target, restDelay: options.restDelay });
    if (!options.preserveJump) {
      setQueuedJump(options.followUp ? { id, started: false } : null);
    }
  }, []);

  const rest = useCallback((delay: number, preserveJump = false) => {
    play('idle', undefined, { preserveJump });
    waitToWander(delay);
  }, [play, waitToWander]);

  const acceptAction = useEffectEvent((requested: Action) => {
    if (!running || action.id !== requested.id || shown?.id === requested.id) return;
    setShown(requested);
    if (requested.text) say(requested.text);
    if (requested.target) setWalkTarget(requested.target);
    setQueuedJump(previous => previous?.id === requested.id ? { ...previous, started: true } : previous);
  });
  const rejectAction = useEffectEvent((requested: Action) => {
    if (!running || action.id !== requested.id) return;
    // Keep the visible src intact. A failed default does not create a retry loop.
    if (requested.mode !== 'idle') rest(2200);
  });

  useEffect(() => {
    if (!running) return;
    let current = true;
    assets.load(SRC[action.mode]).then(
      () => { if (current) acceptAction(action); },
      () => { if (current) rejectAction(action); },
    );
    return () => { current = false; };
  }, [action, running]);

  const mode = shown?.mode ?? 'idle';
  const settled = shown?.id === action.id;
  const emote = mode !== 'idle' && mode !== 'run-left' && mode !== 'run-right';

  usePausableTimeout(() => setBubble(null), bubble ? 2400 : null, running, bubble?.id ?? 'no-bubble');
  usePausableTimeout(() => rest(shown?.restDelay ?? restDelay(), true),
    emote ? DURATION[mode] : null, running && settled && !dragging, shown?.id ?? 'no-action');
  usePausableTimeout(() => play('jump'), queuedJump ? 760 : null,
    running && !!queuedJump?.started && !dragging, queuedJump?.id ?? 'no-jump');

  usePausableTimeout(() => {
    if (!event || handledEvent.current === event.at) return;
    handledEvent.current = event.at;
    const map: Record<PetEventKind, Mode> = {
      open: 'work', close: 'review', drag: 'wait', drop: 'jump',
    };
    const lines = EVENT_LINES[event.kind];
    play(map[event.kind], lines[Math.floor(Math.random() * lines.length)]);
  }, event ? 0 : null, running, event?.at ?? 'no-event');

  useEffect(() => {
    const pet = petRef.current;
    const s = st.current;
    if (!pet || area.w <= 0 || s.ready) return;
    s.x = Math.min(area.w * 0.34, Math.max(10, area.w - petSize(area.w) - 360));
    s.y = area.w <= 768 ? Math.min(area.h * 0.62, area.h - petSize(area.w) - 96) : area.h * 0.46;
    s.ready = true;
    pet.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
  }, [area.w, area.h]);

  usePausableTimeout(() => {
    const b = bounds(area);
    const s = st.current;
    let target: Point = { x: s.x, y: s.y };
    for (let i = 0; i < 6; i++) {
      target = {
        x: b.minX + Math.random() * (b.maxX - b.minX),
        y: b.minY + Math.random() * (b.maxY - b.minY),
      };
      if (Math.hypot(target.x - s.x, target.y - s.y) > 120) break;
    }
    play(target.x >= s.x ? 'run-right' : 'run-left', undefined, { target });
  }, wander?.delay ?? null,
  running && !reducedMotion && area.w > 0 && settled && mode === 'idle' && !dragging && !queuedJump,
  wander?.id ?? 'no-wander');

  const advanceWalk = useEffectEvent((target: Point, dt: number) => {
    if (!running || reducedMotion || !settled || walkTarget !== target || st.current.drag) return false;
    const pet = petRef.current;
    if (!pet) return false;
    const s = st.current;
    const dx = target.x - s.x;
    const dy = target.y - s.y;
    const distance = Math.hypot(dx, dy);
    const step = SPEED * dt;
    const arrived = distance <= step || distance < 2;
    if (arrived) {
      s.x = target.x;
      s.y = target.y;
    } else {
      s.x += (dx / distance) * step;
      s.y += (dy / distance) * step;
    }
    pet.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
    if (arrived) {
      if (Math.random() < 0.22) play('wave');
      else rest(restDelay());
    }
    return !arrived;
  });

  // There is no frame loop while idle, loading, emoting, dragging, or paused.
  useEffect(() => {
    if (!running || reducedMotion || !walkTarget) return;
    let frame = 0;
    let current = true;
    let last = performance.now();
    const move = (now: number) => {
      if (!current) return;
      const dt = Math.min(260, now - last) / 1000;
      last = now;
      if (advanceWalk(walkTarget, dt)) frame = requestAnimationFrame(move);
    };
    frame = requestAnimationFrame(move);
    return () => { current = false; cancelAnimationFrame(frame); };
  }, [running, reducedMotion, walkTarget]);

  const clearDrag = useCallback(() => {
    const d = dragInfo.current;
    dragInfo.current = null;
    st.current.drag = false;
    if (d?.element.hasPointerCapture(d.pointerId)) d.element.releasePointerCapture(d.pointerId);
    if (d?.moved) setDragging(false);
  }, []);
  useEffect(() => () => clearDrag(), [running, clearDrag]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!running || !e.isPrimary || e.button !== 0) return;
    e.stopPropagation();
    suppressClick.current = false;
    const s = st.current;
    dragInfo.current = {
      sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y, moved: false,
      pointerId: e.pointerId, element: e.currentTarget,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragInfo.current;
    if (!running || !d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 5) return;
    if (!d.moved) {
      d.moved = true;
      suppressClick.current = true;
      st.current.drag = true;
      setDragging(true);
      play('sad', '放我下来…');
    }
    const size = petSize(area.w);
    st.current.x = Math.max(0, Math.min(Math.max(0, area.w - size), d.ox + dx));
    st.current.y = Math.max(0, Math.min(Math.max(0, area.h - size), d.oy + dy));
    if (petRef.current) {
      petRef.current.style.transform = `translate3d(${st.current.x}px, ${st.current.y}px, 0)`;
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragInfo.current;
    if (!d || d.pointerId !== e.pointerId) return;
    clearDrag();
    if (d.moved) play('jump', '就站这儿', { restDelay: 2200 });
  };

  const onClick = () => {
    if (!running) return;
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    const text = CLICK_LINES[Math.floor(Math.random() * CLICK_LINES.length)];
    play('wave', text, { followUp: true });
  };

  return (
    <div
      className="xiaojing"
      ref={petRef}
      role="button"
      tabIndex={0}
      aria-label="小镜，桌面伙伴"
      data-active={running}
      data-moving={running && (dragging || (!reducedMotion && !!walkTarget))}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {bubble ? <span className="xiaojing-bubble" aria-hidden="true">{bubble.text}</span> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SRC[mode]} alt="" draggable={false} fetchPriority={mode === 'idle' ? 'high' : 'auto'} />
    </div>
  );
}
