'use client';

import { useCallback, useRef, useState } from 'react';
import { tabs, type TabId } from '@/data/content';
import Terminal from './Terminal';
import DesktopOS from './DesktopOS';
import ExitSection from './ExitSection';
import Works from './Works';
import About from './About';

type Phase = 'intro' | 'desktop';

export default function Portfolio() {
  const [tab, setTab] = useState<TabId>('home');
  const [phase, setPhase] = useState<Phase>('intro');
  const [introReady, setIntroReady] = useState(false);
  const [flash, setFlash] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);

  /* Zoom the laptop screen to fill the viewport, flash blue, then show the desktop. */
  const launch = useCallback(() => {
    const hero = heroRef.current;
    const wrap = wrapRef.current;
    const screen = screenRef.current;
    if (!introReady) return;
    if (!hero || !wrap || !screen) {
      setPhase('desktop');
      return;
    }

    const r = screen.getBoundingClientRect();
    const scale = Math.max(window.innerWidth / r.width, window.innerHeight / r.height) * 1.05;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const w = wrap.getBoundingClientRect();
    const wx = w.left + w.width / 2;
    const wy = w.top + w.height / 2;
    const dx = cx - wx;
    const dy = cy - wy;
    const tx = window.innerWidth / 2 - (wx + dx * scale);
    const ty = window.innerHeight / 2 - (wy + dy * scale);

    termRef.current?.classList.add('scale-through');
    wrap.classList.add('zoom-transition');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        wrap.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      });
    });

    window.setTimeout(() => setFlash(true), 1200);
    window.setTimeout(() => {
      setPhase('desktop');
      window.scrollTo(0, 0);
      window.setTimeout(() => setFlash(false), 260);
    }, 1800);
  }, [introReady]);

  const restart = useCallback(() => {
    setPhase('intro');
    setIntroReady(false);
    window.scrollTo(0, 0);
  }, []);

  const switchTab = useCallback(
    (next: TabId) => {
      if (next === tab) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      setFlash(true);
      window.setTimeout(() => {
        setTab(next);
        window.scrollTo(0, 0);
        setFlash(false);
      }, 220);
    },
    [tab],
  );

  return (
    <>
      <main>
        <section className={`tab-page${tab === 'home' ? ' active' : ''}`} id="page-home">
          {phase === 'intro' ? (
            <div className="hero-section" ref={heroRef} onClick={launch}>
              <div className="macbook-wrapper" ref={wrapRef}>
                <div className="macbook-screen-bezel">
                  <div className="macbook-notch" />
                  <div className="macbook-screen" ref={screenRef}>
                    <div ref={termRef}>
                      <Terminal onLaunch={launch} onReady={() => setIntroReady(true)} />
                    </div>
                  </div>
                </div>
                <div className="macbook-hinge" />
                <div className="macbook-base" />
                <div className="macbook-shadow" />
              </div>
              <div className={`hero-cta${introReady ? ' visible' : ''}`}>
                <span className="cta-text">按 Enter 或点击屏幕启动</span>
                <span className="cta-arrow">↓</span>
              </div>
            </div>
          ) : (
            <>
              <DesktopOS onGoWorks={() => switchTab('works')} />
              <ExitSection onRestart={restart} />
            </>
          )}
        </section>

        <section className={`tab-page${tab === 'works' ? ' active' : ''}`} id="page-works">
          <Works />
        </section>

        <section className={`tab-page${tab === 'about' ? ' active' : ''}`} id="page-about">
          <About />
        </section>
      </main>

      <div className={`transition-overlay${flash ? ' active' : ''}`} aria-hidden="true" />

      <nav
        className={`pill-nav${
          tab === 'home' && phase === 'intro' && !introReady ? ' hidden-during-intro' : ''
        }`}
        aria-label="站点导航"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'active' : ''}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => switchTab(t.id)}
          >
            <span className="pill-num">{t.num}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </>
  );
}
