'use client';

import { useCallback, useEffect, useState } from 'react';
import { tabs, type TabId } from '@/data/content';
import Terminal from './Terminal';
import HomeContent from './HomeContent';
import DesktopOS from './DesktopOS';
import Works from './Works';
import Goodbye from './Goodbye';

export default function Portfolio() {
  const [tab, setTab] = useState<TabId>('home');
  const [introDone, setIntroDone] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 2600);
    return () => clearTimeout(t);
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
          <div className="hero-section">
            <div className="macbook-wrapper">
              <div className="macbook-screen-bezel">
                <div className="macbook-notch" />
                <div className="macbook-screen">
                  <Terminal />
                </div>
              </div>
              <div className="macbook-hinge" />
              <div className="macbook-base" />
              <div className="macbook-shadow" />
            </div>
            <button
              type="button"
              className={`hero-cta${introDone ? ' visible' : ''}`}
              onClick={() => {
                document.getElementById('intro')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="cta-text">SCROLL TO EXPLORE</span>
              <span className="cta-arrow">↓</span>
            </button>
          </div>

          <HomeContent />

          <Goodbye
            onBack={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        </section>

        <section className={`tab-page${tab === 'os' ? ' active' : ''}`} id="page-os">
          <DesktopOS onGoWorks={() => switchTab('works')} />
        </section>

        <section className={`tab-page${tab === 'works' ? ' active' : ''}`} id="page-works">
          <Works />
          <Goodbye
            onBack={() => switchTab('home')}
          />
        </section>
      </main>

      <div className={`transition-overlay${flash ? ' active' : ''}`} aria-hidden="true" />

      <nav
        className={`pill-nav${tab === 'home' && !introDone ? ' hidden-during-intro' : ''}`}
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
