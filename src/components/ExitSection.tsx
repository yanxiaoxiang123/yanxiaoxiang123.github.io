'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createMotionHint, browserHintScheduler } from '@/lib/motion-hint';

/**
 * Scroll-driven exit: the desktop screen starts filling the viewport and
 * shrinks back into a laptop while the goodbye terminal fades in.
 * Mirrors the reference site's exit-section behaviour.
 */
export default function ExitSection({ onRestart, running, reducedMotion, children, footer, restartLabel }: {
  onRestart: () => void; running: boolean; reducedMotion: boolean;
  children: ReactNode; footer: string; restartLabel: string;
}) {
  const section = useRef<HTMLElement>(null);
  const mac = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running || reducedMotion) return;
    let raf = 0;
    let lastProgress: number | null = null;
    const root = section.current;
    if (!root) return;
    const hint = createMotionHint(active => root.toggleAttribute('data-compositing', active), browserHintScheduler);
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const update = () => {
      raf = 0;
      const s = section.current;
      const m = mac.current;
      const g = screen.current;
      if (!s || !m || !g) return;

      const rect = s.getBoundingClientRect();
      const total = s.offsetHeight;
      const vh = window.innerHeight;
      const scrolled = -rect.top;
      const range = total - vh;
      if (range <= 0) return;

      const a = Math.max(0, Math.min(1, scrolled / range));
      if (a > 0 && a < 0.78 && lastProgress !== null && a !== lastProgress) hint.pulse();
      else if (a === 0 || a >= 0.78) hint.clear();
      lastProgress = a;
      const o = ease(Math.min(1, a / 0.5));

      const mobile = window.innerWidth <= 768;
      const sw = mobile ? 322 : 680;
      const sh = mobile ? 250 : 440;
      const full = Math.max(window.innerWidth / sw, vh / sh) * 1.05;
      const scale = full - (full - 1) * o;

      m.style.transform = `scale(${scale})`;
      m.style.opacity = '1';

      if (a >= 0.26) {
        const l = Math.min(1, (a - 0.26) / 0.52);
        g.classList.add('visible');
        g.style.opacity = String(ease(l));
      } else {
        g.classList.remove('visible');
        g.style.opacity = '0';
      }
      if (a >= 0.78) {
        m.style.transform = 'scale(1)';
        g.style.opacity = '1';
        g.classList.add('visible');
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
      hint.clear();
    };
  }, [running, reducedMotion]);

  return (
    <section className={`exit-section${!reducedMotion ? ' is-animated' : ''}`} ref={section}>
      <div className="exit-sticky">
        <div className="exit-macbook-wrapper" ref={mac}>
          <div className="exit-bezel">
            <div className="exit-notch" />
            <div className="exit-screen">
              <div className="goodbye-screen" ref={screen}>
                <div className="goodbye-titlebar">
                  <span className="terminal-dot red" />
                  <span className="terminal-dot yellow" />
                  <span className="terminal-dot green" />
                  <span className="goodbye-title-text">yanxx@universe ~ zsh</span>
                </div>
                <div className="goodbye-body">
                  <div className="goodbye-terminal">
                    {children}
                  </div>
                </div>
                <div className="goodbye-footer">
                  {footer}
                  <button type="button" className="goodbye-back" onClick={onRestart}>
                    {restartLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="exit-hinge" />
          <div className="exit-base" />
          <div className="exit-shadow" />
        </div>
      </div>
    </section>
  );
}
