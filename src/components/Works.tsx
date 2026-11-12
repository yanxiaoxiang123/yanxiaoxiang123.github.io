import { projects } from '@/data/content';

export default function Works() {
  return (
    <div className="works-page" id="works-top">
      <div className="section-label">~/projects</div>
      <h1 className="works-heading">精选项目</h1>
      <p className="works-sub">
        三个从想法走到可用形态的系统，工程、数据与模型各自承担一部分。
      </p>
      <div className="works-grid">
        {projects.map((p) => (
          <article className={`work-card accent-${p.accent}`} key={p.slug}>
            <div className="wc-meta">
              {p.icon} {p.role} · {p.period}
            </div>
            <h3>{p.title}</h3>
            <div className="wc-sub">{p.subtitle}</div>
            <p className="wc-summary">{p.summary}</p>
            <div className="wc-stack">{p.stack}</div>
            <ul>
              {p.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
