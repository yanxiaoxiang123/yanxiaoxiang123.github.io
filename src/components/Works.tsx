import { projects, toolkitFolders, vibeCards } from '@/data/content';
import Sticker from './Sticker';

const WASH: Record<string, string> = {
  blue: 'rgba(43, 127, 216, 0.26)',
  yellow: 'rgba(244, 215, 88, 0.42)',
  red: 'rgba(232, 74, 95, 0.22)',
};

/* Stickers that pop out of a project card on hover. */
const POP_STICKERS: {
  src: string;
  size: number;
  rotate: number;
  delay: number;
  style: React.CSSProperties;
}[][] = [
  [
    { src: 'bull', size: 92, rotate: 8, delay: 0, style: { right: '30%', top: '4%' } },
    { src: 'coins', size: 74, rotate: -10, delay: 60, style: { right: '6%', bottom: '10%' } },
    { src: 'star', size: 54, rotate: 18, delay: 120, style: { left: '4%', bottom: '9%' } },
    { src: 'tape', size: 96, rotate: -6, delay: 180, style: { left: '40%', bottom: '6%' } },
  ],
  [
    { src: 'doc', size: 84, rotate: -8, delay: 0, style: { right: '29%', top: '3%' } },
    { src: 'magnifier', size: 80, rotate: 10, delay: 60, style: { right: '5%', bottom: '12%' } },
    { src: 'clip', size: 56, rotate: -20, delay: 120, style: { left: '4%', bottom: '9%' } },
    { src: 'flower', size: 64, rotate: 12, delay: 180, style: { left: '41%', bottom: '7%' } },
  ],
  [
    { src: 'truck', size: 100, rotate: 6, delay: 0, style: { right: '29%', top: '4%' } },
    { src: 'route', size: 88, rotate: -8, delay: 60, style: { right: '5%', bottom: '10%' } },
    { src: 'arrow', size: 76, rotate: -14, delay: 120, style: { left: '4%', bottom: '10%' } },
    { src: 'marker', size: 88, rotate: 12, delay: 180, style: { left: '41%', bottom: '6%' } },
  ],
];

const BOARD_STICKERS = [
  { src: 'marker', size: 116, rotate: -14, style: { left: '0.5%', bottom: '3%' } },
  { src: 'coffee', size: 92, rotate: 9, style: { right: '2%', top: '5%' } },
  { src: 'heart', size: 52, rotate: -8, style: { left: '46%', top: '1%' } },
  { src: 'star', size: 64, rotate: 12, style: { right: '20%', bottom: '2%' } },
  { src: 'clip', size: 52, rotate: 10, style: { left: '23%', top: '26%' } },
  { src: 'flower', size: 56, rotate: -6, style: { right: '34%', top: '22%' } },
  { src: 'tape', size: 96, rotate: 6, style: { left: '58%', bottom: '4%' } },
];

const TK_STICKERS = [
  { src: 'marker', size: 104, rotate: -12, style: { left: '28%', bottom: '2%' } },
  { src: 'coffee', size: 78, rotate: 8, style: { right: '2%', top: '2%' } },
  { src: 'flower', size: 60, rotate: -8, style: { left: '1%', bottom: '4%' } },
  { src: 'heart', size: 44, rotate: -10, style: { left: '68%', bottom: '3%' } },
  { src: 'badge-system', size: 140, rotate: -6, style: { left: '33%', top: '1%' } },
  { src: 'badge-detail', size: 140, rotate: 7, style: { right: '1%', bottom: '16%' } },
  { src: 'badge-ai', size: 140, rotate: -4, style: { left: '1%', bottom: '18%' } },
];

const stickerUrl = (name: string) => `/images/stickers/${name}.png`;

export default function Works() {
  return (
    <div className="works-page" id="works-top">
      <header className="works-head">
        <div className="section-label">~/projects</div>
        <h1 className="works-heading">精选项目</h1>
        <p className="works-sub">
          三个从想法走到可用形态的系统，工程、数据与模型各自承担一部分。
        </p>
      </header>

      {/* Featured Projects */}
      <section className="fx-list" aria-label="精选项目">
        {projects.map((p, i) => (
          <article
            className={`fx-card fx-${p.accent}`}
            key={p.slug}
            style={
              {
                '--wash': WASH[p.accent],
                animationDelay: `${i * 90}ms`,
              } as React.CSSProperties
            }
          >
            <div className="fx-text">
              <div className="fx-meta">
                {p.icon} {p.role} · {p.period}
              </div>
              <h2 className="fx-title">{p.title}</h2>
              <p className="fx-blurb">{p.summary}</p>
              <div className="fx-tags">
                {p.stack.split(' · ').map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>

            <div className="fx-shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="fx-screen"
                src={`/images/projects/${p.slug}.webp`}
                alt={`${p.title} 界面示意`}
                loading="lazy"
              />
            </div>

            {POP_STICKERS[i].map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={s.src + s.delay}
                className="fx-pop"
                src={stickerUrl(s.src)}
                alt=""
                aria-hidden="true"
                draggable={false}
                style={
                  {
                    width: s.size,
                    '--r': `${s.rotate}deg`,
                    '--d': `${s.delay}ms`,
                    ...s.style,
                  } as React.CSSProperties
                }
              />
            ))}
          </article>
        ))}
      </section>

      {/* Vibe Coding */}
      <section className="vibe" aria-label="Vibe Coding">
        <div className="works-head">
          <div className="section-label">~/vibe-coding</div>
          <h2 className="works-heading sm">Vibe Coding</h2>
          <p className="works-sub">和 Agent 一起，把想法写成能跑的东西。贴纸可以拖着玩。</p>
        </div>

        <div className="vibe-board">
          {BOARD_STICKERS.map((s) => (
            <Sticker
              key={s.src}
              src={stickerUrl(s.src)}
              alt=""
              size={s.size}
              rotate={s.rotate}
              style={{ position: 'absolute', ...s.style }}
            />
          ))}

          {vibeCards.map((c, i) => (
            <div
              className="vibe-slot"
              key={c.title}
              style={{
                left: `${c.x}%`,
                top: `${c.y}%`,
                animationDelay: `${i * 70}ms`,
              }}
            >
              <div className="vibe-card" style={{ '--r': `${c.r}deg` } as React.CSSProperties}>
                <span className="vc-emoji">{c.emoji}</span>
                <b>{c.title}</b>
                <span className="vc-note">{c.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* My Design Toolkit */}
      <section className="tk" aria-label="My Design Toolkit">
        <div className="works-head">
          <div className="section-label">~/toolkit</div>
          <h2 className="works-heading sm">My Design Toolkit</h2>
          <p className="works-sub">
            自己的拼贴与照片——鼠标放上去，照片会从文件夹里弹出来；贴纸可以拖着玩，松手自己回去。
          </p>
        </div>

        <div className="tk-board">
          {TK_STICKERS.map((s) => (
            <Sticker
              key={s.src}
              src={stickerUrl(s.src)}
              alt=""
              size={s.size}
              rotate={s.rotate}
              style={{ position: 'absolute', ...s.style }}
            />
          ))}

          {toolkitFolders.map((f, i) => (
            <div
              className="tk-slot"
              key={f.title}
              tabIndex={0}
              style={
                {
                  top: f.top,
                  left: f.left,
                  '--rot': `${f.rot}deg`,
                  animationDelay: `${i * 90}ms`,
                } as React.CSSProperties
              }
            >
              <div className="tk-folder">
                <div className="tk-fold">
                  <div className="tk-folder-back" />

                  <div className="tk-item tk-item-a">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.items[0].src} alt={f.items[0].label} loading="lazy" />
                  </div>
                  <div className="tk-item tk-item-b">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.items[1].src} alt={f.items[1].label} loading="lazy" />
                  </div>

                  <div className="tk-front">
                    <span className="tk-noise" />
                    <span className="tk-logo">✦</span>
                  </div>
                </div>

                <div className="tk-title">
                  <p>{f.title}</p>
                  <span>{f.meta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
