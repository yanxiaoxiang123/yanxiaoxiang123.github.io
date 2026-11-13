import { contactInfo, goodbye } from '@/data/content';

/** Static farewell and contact copy is rendered by the page's server component. */
export default function ExitContent() {
  return <>
    {goodbye.lines.map((line) => (
      <div key={line.cmd}>
        <div className="gt-line">
          <span className="gt-prompt">$ </span>
          <span className="gt-cmd">{line.cmd}</span>
        </div>
        {line.cmd === 'cat contact.md' ? (
          <>
            <div className="gt-line gt-output">
              <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
            </div>
            <div className="gt-line gt-output">
              <a href={contactInfo.github} target="_blank" rel="noreferrer noopener">
                github.com/yanxiaoxiang123
              </a>
            </div>
          </>
        ) : (
          <div className={`gt-line ${line.gold ? '' : 'gt-output'}`}>
            {line.gold ? (
              <span className="gt-gold">{line.out}</span>
            ) : (
              line.out
            )}
          </div>
        )}
      </div>
    ))}
  </>;
}
