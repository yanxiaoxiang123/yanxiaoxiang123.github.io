'use client';

import { useEffect, useRef } from 'react';
import { about, research } from '@/data/content';

/* geometry — viewport heights unless the name says px */
const STATION_TOP = 0.56; // first card's top at page start
const STATION_GAP = 0.38; // distance between stations; one full S half-wave
const TRAIN_GAP = 0.21; // how far each towed card sits behind the plane
const HOOK_SPAN = 0.1; // vh of travel over which a card is yanked in
const TRAIN_SCALE = 0.88;
const FINAL_TOP = 0.1; // vh
const FINAL_STEP = 0.145; // vh
const PLANE_START = 0.2;
const PLANE_RISE = 0.48;

type Pt = { x: number; y: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const backOut = (t: number) => {
  const c1 = 1.15;
  const c3 = c1 + 1;
  const u = t - 1;
  return 1 + c3 * u * u * u + c1 * u * u;
};

/* a soft string that passes through every point */
function stringPath(pts: Pt[]) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.14;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function AboutFlight() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLImageElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    const sticky = stickyRef.current;
    const plane = planeRef.current;
    const line = lineRef.current;
    const paper = paperRef.current;
    if (!root || !sticky || !plane || !line) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('is-static');
      return;
    }
    root.classList.add('has-js');

    const heights: number[] = [];
    const measure = () => {
      cardRefs.current.forEach((el, i) => {
        heights[i] = el && el.offsetHeight ? el.offsetHeight : 320;
      });
    };
    measure();

    let raf = 0;
    let lastP = 0;
    let vel = 0;
    let wasSettled = false;

    const update = () => {
      raf = 0;
      const vw = sticky.clientWidth;
      const vh = sticky.clientHeight;
      if (!vw || !vh) return;
      if (!heights[0]) measure();

      const total = root.offsetHeight - vh;
      const scrolled = -root.getBoundingClientRect().top;
      const p = total > 0 ? clamp01(scrolled / total) : 0;
      const dv = p - lastP;
      lastP = p;
      vel = vel * 0.84 + dv * 0.16;
      const small = vw <= 768;

      const cx = vw * 0.5;
      const world0 = vh * STATION_TOP;
      const gap = vh * STATION_GAP;
      const tallest = Math.max(0, ...heights) || 320;
      const trainGap = Math.max(vh * TRAIN_GAP, tallest * TRAIN_SCALE + 22);
      const amp = small ? 0 : Math.min(210, vw * 0.155);
      const finalAmp = small ? vw * 0.22 : Math.min(200, vw * 0.16);
      const finalScale = small ? 0.66 : 0.74;

      /* one serpentine string: the station line and the plane ride the same wave */
      const wave = (wy: number) =>
        cx + amp * Math.sin((Math.PI * (wy - world0)) / gap - Math.PI / 2);

      const descend = smooth(0, 0.82, p);
      const gather = smooth(0.78, 0.97, p);
      const land = smooth(0.82, 1, p);

      const hookY = vh * (PLANE_START + PLANE_RISE * descend);
      const planeWindowY = hookY - Math.max(0, vel) * 120;
      const planeY = lerp(planeWindowY, vh * 0.9, land);
      const planeX = lerp(wave(scrolled + planeWindowY), cx + finalAmp, land);

      if (paper) paper.style.opacity = smooth(0.7, 0.88, p).toFixed(3);

      const cards = cardRefs.current;
      const n = cards.length;
      const hk: number[] = [];
      const slot: number[] = [];

      /* a card is hooked the moment the plane reaches its pin */
      for (let i = 0; i < n; i++) {
        const stationY = vh * (STATION_TOP + STATION_GAP * i) - scrolled;
        hk[i] = 1 - smooth(0, HOOK_SPAN * vh, stationY - hookY);
      }
      /* earlier pickups are pushed further up the string */
      for (let i = 0; i < n; i++) {
        let s = 0;
        for (let j = i + 1; j < n; j++) s += hk[j];
        slot[i] = s;
      }

      const pins: Pt[] = [];

      cards.forEach((card, i) => {
        if (!card) return;
        const stationWorld = vh * (STATION_TOP + STATION_GAP * i);
        const sy = stationWorld - scrolled;
        const stationRot = (i % 2 === 0 ? -1.6 : 1.6) + Math.sin(p * 6 + i * 1.9) * 0.5;

        /* towed: hangs on the same string, one gap behind the card below it */
        const towWorld = scrolled + planeY - (slot[i] + 1) * trainGap;
        const tx = wave(towWorld) + Math.sin(p * 12 + i * 1.3) * 5 + vel * 420;
        const ty = towWorld - scrolled;
        const towRot = Math.sin(p * 10 + i * 1.5) * 2.2 + vel * 180;

        const e = backOut(hk[i]);
        const swing = Math.sin(hk[i] * Math.PI * 3) * (1 - hk[i]);

        let x = lerp(wave(stationWorld), tx, e) + swing * 16;
        let y = lerp(sy, ty, e);
        let rot = lerp(stationRot, towRot, e) + swing * 6;
        let scale = lerp(1, TRAIN_SCALE, e) + Math.sin(hk[i] * Math.PI) * 0.05;

        /* the whole string settles onto one page, staggered, never stacked */
        const fx = cx + (i % 2 === 0 ? -1 : 1) * finalAmp;
        const fy = vh * FINAL_TOP + i * vh * FINAL_STEP;
        const fRot = (i % 2 === 0 ? -1 : 1) * 2.6;

        x = lerp(x, fx, gather);
        y = lerp(y, fy, gather);
        rot = lerp(rot, fRot, gather);
        scale = lerp(scale, finalScale, gather);

        card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        card.style.zIndex = `${20 - (gather > 0.45 ? i : Math.round(slot[i]))}`;

        pins.push({ x, y });
      });

      /* one string: through the towed cards, the plane, then the waiting ones */
      const sorted = pins.slice().sort((a, b) => a.y - b.y);
      const path: Pt[] = [{ x: cx, y: -40 }];
      let inserted = false;
      for (const pt of sorted) {
        if (!inserted && pt.y > planeY) {
          path.push({ x: planeX, y: planeY });
          inserted = true;
        }
        path.push(pt);
      }
      if (!inserted) path.push({ x: planeX, y: planeY });
      const tail = path[path.length - 1];
      if (tail.y < vh - 24) path.push({ x: tail.x, y: Math.min(vh + 80, tail.y + 110) });

      line.setAttribute('d', stringPath(path));

      /* keep the nose on the string's tangent — flying down, not drifting */
      const phase = (Math.PI * (scrolled + planeWindowY - world0)) / gap;
      const tangent = ((amp * Math.PI) / gap) * Math.sin(phase);
      const flightAngle = (Math.atan2(1, tangent) * 180) / Math.PI + 25;
      const angle = lerp(flightAngle, 66, land);
      plane.style.transform = `translate3d(${planeX.toFixed(1)}px, ${planeY.toFixed(1)}px, 0) rotate(${angle.toFixed(1)}deg)`;

      const settled = gather > 0.55;
      if (settled !== wasSettled) {
        root.classList.toggle('is-settled', settled);
        wasSettled = settled;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(sticky);
    cardRefs.current.forEach((el) => el && ro.observe(el));

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const cards = [
    <article className="fl-stop" key="intro" ref={(el) => { cardRefs.current[0] = el; }}>
      <div className="fl-card">
        <span className="fl-pin" aria-hidden="true" />
        <div className="section-label">{about.intro.label}</div>
        <h1 className="fl-title">{about.intro.heading}</h1>
        <p className="fl-body">{about.intro.body}</p>
      </div>
    </article>,
    <article className="fl-stop" key="values" ref={(el) => { cardRefs.current[1] = el; }}>
      <div className="fl-card">
        <span className="fl-pin" aria-hidden="true" />
        <div className="section-label">{about.values.label}</div>
        <h2 className="fl-title sm">{about.values.heading}</h2>
        <ul className="fl-list">
          {about.values.items.map((item) => (
            <li key={item.title}>
              <b>{item.title}</b>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>,
    <article className="fl-stop" key="journey" ref={(el) => { cardRefs.current[2] = el; }}>
      <div className="fl-card">
        <span className="fl-pin" aria-hidden="true" />
        <div className="section-label">{about.timeline.label}</div>
        <h2 className="fl-title sm">{about.timeline.heading}</h2>
        <ul className="fl-timeline">
          {about.timeline.items.map((item) => (
            <li key={item.date + item.title}>
              <span className="fl-date">{item.date}</span>
              <b>{item.title} · {item.place}</b>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>,
    <article className="fl-stop" key="practice" ref={(el) => { cardRefs.current[3] = el; }}>
      <div className="fl-card">
        <span className="fl-pin" aria-hidden="true" />
        <div className="section-label">实践与实验</div>
        <h2 className="fl-title sm">在应用之外</h2>
        <ul className="fl-list">
          {research.map((item) => (
            <li key={item.title}>
              <b>{item.title}</b>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>,
    <article className="fl-stop" key="now" ref={(el) => { cardRefs.current[4] = el; }}>
      <div className="fl-card">
        <span className="fl-pin" aria-hidden="true" />
        <div className="section-label">{about.now.label}</div>
        <h2 className="fl-title sm">{about.now.heading}</h2>
        <ul className="fl-now">
          {about.now.items.map((item) => (
            <li key={item.title}>
              <b>{item.title}</b>
              <span>{item.sub}</span>
            </li>
          ))}
        </ul>
        <div className="todo-note">{about.now.todo}</div>
      </div>
    </article>,
  ];

  return (
    <div className="flight" ref={rootRef}>
      <div className="flight-sticky" ref={stickyRef}>
        <div className="fl-sky" aria-hidden="true" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fl-deco fl-deco-top" src="/images/flight/cloud-bank.png" alt="" aria-hidden="true" draggable={false} />

        <svg className="fl-line" aria-hidden="true">
          <path ref={lineRef} fill="none" />
        </svg>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="fl-plane" ref={planeRef} src="/images/flight/plane.png" alt="" aria-hidden="true" draggable={false} />

        {cards}

        <div className="fl-paper" ref={paperRef} aria-hidden="true">
          <span className="fl-paper-line" />
          <span className="fl-paper-line short" />
          <span className="fl-paper-fold" />
        </div>
      </div>
    </div>
  );
}
