'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { tabs, type TabId } from '@/data/navigation';
import type { DesktopContent, RepositoryIcon } from '@/lib/desktop-content';
import { usePortfolioLifecycle } from '@/hooks/usePortfolioLifecycle';
import Terminal from './Terminal';
import ExitSection from './ExitSection';
import { PageActivityProvider } from './PageActivity';

const DesktopOS = dynamic(() => import('./DesktopOS'), {
  loading: () => <p role="status">正在打开桌面…</p>,
});

type PortfolioProps = {
  works: ReactNode;
  about: ReactNode;
  desktopContent: DesktopContent;
  repositories: RepositoryIcon[];
  exitContent: ReactNode;
  exitFooter: string;
  restartLabel: string;
};

export default function Portfolio({ works, about, desktopContent, repositories,
  exitContent, exitFooter, restartLabel }: PortfolioProps) {
  const { state, dispatch, enhanced, reducedMotion, canRun, switchTab, launch, restart } = usePortfolioLifecycle();
  const { currentTab, phase, attempt, desktopMounted, navigation, visited } = state;
  const wrapRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<Animation | null>(null);
  const homeRunning = canRun('home');
  const zooming = phase === 'zooming' || phase === 'covered';

  // A single owned animation can be paused without losing its playback position.
  useEffect(() => {
    const wrap = wrapRef.current;
    const screen = screenRef.current;
    if (!zooming || reducedMotion || !wrap || !screen) return;
    const r = screen.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const scale = Math.max(window.innerWidth / r.width, window.innerHeight / r.height) * 1.05;
    const wx = w.left + w.width / 2;
    const wy = w.top + w.height / 2;
    const tx = window.innerWidth / 2 - (wx + (r.left + r.width / 2 - wx) * scale);
    const ty = window.innerHeight / 2 - (wy + (r.top + r.height / 2 - wy) * scale);
    const animation = wrap.animate([
      { transform: 'translate(0, 0) scale(1)' },
      { transform: `translate(${tx}px, ${ty}px) scale(${scale})` },
    ], { duration: 1800, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' });
    zoomRef.current = animation;
    return () => { animation.cancel(); zoomRef.current = null; };
  }, [zooming, reducedMotion]);

  useEffect(() => {
    if (homeRunning) zoomRef.current?.play();
    else zoomRef.current?.pause();
  }, [homeRunning, zooming, reducedMotion]);

  const pageAttributes = (id: TabId) => ({
    className: `tab-page${currentTab === id ? ' active' : ''}`,
    'data-visited': visited[id],
    'data-running': canRun(id),
    'data-motion': canRun(id) && !reducedMotion,
  });

  return (
    <div className={`portfolio${enhanced ? ' is-enhanced' : ''}`}
      data-tab={currentTab} data-phase={phase} data-attempt={attempt}>
      <main>
        <section {...pageAttributes('home')} id="page-home">
          <div className="hero-section" hidden={phase === 'desktop'} onClick={launch}
            data-motion={homeRunning && phase !== 'desktop' && !reducedMotion}>
            <div className="macbook-wrapper" ref={wrapRef}>
              <div className="macbook-screen-bezel">
                <div className="macbook-notch" />
                <div className="macbook-screen" ref={screenRef}>
                  <Terminal key={attempt} phase={phase} running={homeRunning && phase !== 'desktop'}
                    enhanced={enhanced} reducedMotion={reducedMotion} onLaunch={launch}
                    onReady={() => dispatch({ type: 'ready', attempt })}
                    onBooted={() => dispatch({ type: 'booted', attempt })} />
                </div>
              </div>
              <div className="macbook-hinge" />
              <div className="macbook-base" />
              <div className="macbook-shadow" />
            </div>
            <div className={`hero-cta${phase === 'ready' || phase === 'booting' ? ' visible' : ''}`}>
              <button className="cta-text" type="button" onClick={launch} disabled={phase !== 'ready'}>
                {phase === 'booting' ? '正在启动…' : '按 Enter 或点击屏幕启动'}
              </button>
              <span className="cta-arrow" aria-hidden="true">↓</span>
            </div>
          </div>

          {/* Mount this workspace once. Hiding it never clears windows or icon positions. */}
          {desktopMounted && (
            <div hidden={phase !== 'desktop'} data-motion={homeRunning && phase === 'desktop' && !reducedMotion}>
              <DesktopOS running={homeRunning && phase === 'desktop'} reducedMotion={reducedMotion}
                content={desktopContent} repositories={repositories} onGoWorks={() => switchTab('works')} />
              <ExitSection running={homeRunning && phase === 'desktop'} reducedMotion={reducedMotion}
                onRestart={restart} footer={exitFooter} restartLabel={restartLabel}>
                {exitContent}
              </ExitSection>
            </div>
          )}
        </section>

        {/* Static HTML remains available before enhancement. Expensive work is activity-gated. */}
        <section {...pageAttributes('works')} id="page-works">
          <PageActivityProvider running={canRun('works')} reducedMotion={reducedMotion}>
            {works}
          </PageActivityProvider>
        </section>
        <section {...pageAttributes('about')} id="page-about">
          <PageActivityProvider running={visited.about && canRun('about')} reducedMotion={reducedMotion}>
            {about}
          </PageActivityProvider>
        </section>
      </main>

      <div className={`transition-overlay${!reducedMotion && (navigation || (currentTab === 'home' && phase === 'covered')) ? ' active' : ''}`}
        aria-hidden="true" />
      <nav className="pill-nav" aria-label="站点导航">
        {tabs.map((t) => (
          <button key={t.id} type="button" className={currentTab === t.id ? 'active' : ''}
            aria-current={currentTab === t.id ? 'page' : undefined} onClick={() => switchTab(t.id)}>
            <span className="pill-num">{t.num}</span>{t.label}
          </button>
        ))}
      </nav>
      <noscript>
        <nav className="static-nav" aria-label="页面章节">
          {tabs.map((t) => <a key={t.id} href={`#page-${t.id}`}>{t.label}</a>)}
        </nav>
      </noscript>
    </div>
  );
}
