import { about, contactInfo, profile, projects, repoDetails, research } from '@/data/content';
import type { DesktopContent, RepositoryIcon } from '@/lib/desktop-content';

function RepoWindow({ name }: { name: string }) {
  const r = repoDetails.find((x) => x.name === name);
  if (!r) return null;
  return (
    <>
      <div className="win-title">{r.name}</div>
      <div className="win-sub">
        {r.meta}
        {r.stars > 0 ? ` · ★ ${r.stars}` : ''}
      </div>
      <p className="win-body-text">{r.summary}</p>
      <div className="win-sub" style={{ marginBottom: 8 }}>
        {r.stack}
      </div>
      <ul className="win-list">
        {r.points.map((pt) => (
          <li key={pt}>{pt}</li>
        ))}
      </ul>
      <div className="win-links" style={{ marginTop: 16 }}>
        <a
          href={`https://github.com/yanxiaoxiang123/${r.name}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          在 GitHub 打开 →
        </a>
      </div>
    </>
  );
}

function ProjectWindow({ slug }: { slug: string }) {
  const p = projects.find((x) => x.slug === slug);
  if (!p) return null;
  return (
    <>
      <div className="win-title">{p.title}</div>
      <div className="win-sub">
        {p.role} · {p.period}
      </div>
      <p className="win-body-text">{p.summary}</p>
      <div className="win-sub" style={{ marginBottom: 8 }}>
        {p.stack}
      </div>
      <ul className="win-list">
        {p.points.map((pt) => (
          <li key={pt}>{pt}</li>
        ))}
      </ul>
    </>
  );
}

/** These complete window bodies are built on the server, not imported by DesktopOS. */
export function createDesktopContent(): DesktopContent {
  const content: DesktopContent = {
    about: (
      <>
        <div className="win-title">关于我.md</div>
        <div className="win-sub"># 晏晓翔 · Yan Xiaoxiang</div>
        <p className="win-body-text">
          常州大学计算机硕士在读，探索数据、算法与可用的系统。我的经历横跨数据处理、算法研究、系统开发与交付，
          习惯和 AI Agent 搭档，从需求一路做到能上线的形态。
        </p>
        <p className="win-body-text">比起给自己一个单一的标签，我更希望通过做过的事，让你认识我。</p>
        <div className="win-links">
          <a href={`mailto:${profile.email}`}>发送邮件</a>
          <a href={profile.github} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </div>
      </>
    ),
    journey: (
      <>
        <div className="win-title">经历与教育</div>
        <div className="win-sub">~/journey</div>
        <div className="turning-points">
          {about.timeline.items
            .slice()
            .reverse()
            .map((item) => (
              <div className="tp-item" key={item.date + item.title}>
                <div className="tp-date">{item.date}</div>
                <div className="tp-title">
                  {item.title} · {item.place}
                </div>
                <div className="tp-desc">{item.text}</div>
              </div>
            ))}
        </div>
      </>
    ),
    projects: (
      <>
        <div className="win-title">项目文件夹</div>
        <div className="win-sub">~/works · {projects.length} 个精选项目</div>
        <div className="folder-grid">
          {projects.map((p) => (
            <div className="folder-row" key={p.slug}>
              <div>
                {p.icon} {p.title}
              </div>
              <div className="fr-sub">{p.subtitle}</div>
            </div>
          ))}
        </div>
      </>
    ),
    research: (
      <>
        <div className="win-title">研究实验</div>
        <div className="win-sub">~/practice</div>
        <div className="folder-grid">
          {research.map((r) => (
            <div className="folder-row" key={r.title}>
              <a href={r.url} target="_blank" rel="noreferrer noopener">
                🔬 {r.title}
              </a>
              <div className="fr-sub">{r.text}</div>
            </div>
          ))}
        </div>
      </>
    ),
    sayhi: (
      <>
        <div className="win-title">Say Hi</div>
        <div className="win-sub">{'// 聊聊新的可能'}</div>
        <p className="win-body-text">关于项目、研究或工作机会，欢迎写信，或到 GitHub 找我。</p>
        <div className="win-links">
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
          <a href={profile.github} target="_blank" rel="noreferrer noopener">
            github.com/yanxiaoxiang123
          </a>
        </div>
        <p style={{ color: 'var(--ink-faint)', marginTop: 22, fontSize: 12, fontStyle: 'italic' }}>
          {contactInfo.quote}
        </p>
      </>
    ),
    backing: <ProjectWindow slug="backing" />,
    patent: <ProjectWindow slug="patent" />,
    logistics: <ProjectWindow slug="logistics" />,
  };
  for (const repo of repoDetails) content[`repo:${repo.name}`] = <RepoWindow name={repo.name} />;
  return content;
}

export const repositoryIcons: RepositoryIcon[] = repoDetails.map(({ name, icon }) => ({ name, icon }));
