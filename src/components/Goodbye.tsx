import { contact } from '@/data/content';

export default function Goodbye({ onBack }: { onBack: () => void }) {
  return (
    <section className="exit-section" id="contact">
      <div className="exit-sticky">
        <div className="goodbye-screen">
          <div className="goodbye-titlebar">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
            <span className="goodbye-title-text">say goodbye — zsh</span>
          </div>
          <div className="goodbye-body">
            <div className="goodbye-terminal">
              <div className="gt-line">
                <span className="gt-prompt">➜ </span>
                <span className="gt-cmd">cat contact.txt</span>
              </div>
              <div className="gt-line gt-output">
                <span className="gt-gold">{contact.heading}</span>
              </div>
              <div className="gt-line gt-output">{contact.body}</div>
              <div className="gt-line gt-output">
                <a href={`mailto:${contact.email}`}>mailto: {contact.email}</a>
              </div>
              <div className="gt-line gt-output">
                <a href={contact.github} target="_blank" rel="noreferrer noopener">
                  {contact.github}
                </a>
              </div>
              <div className="gt-line gt-dim">“{contact.quote}”</div>
              <div className="gt-line" style={{ marginTop: 14 }}>
                <span className="gt-prompt">➜ </span>
                <span className="gt-cmd">exit</span>
              </div>
            </div>
          </div>
          <div className="goodbye-footer">{contact.signoff}</div>
        </div>
      </div>
      <div className="back-to-top">
        <button type="button" onClick={onBack}>
          <span className="back-arrow">↑</span>
          {contact.backToTop}
        </button>
      </div>
    </section>
  );
}
