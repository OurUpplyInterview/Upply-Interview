interface Props {
  jobTitle: string;
  company: string;
  questionCount: number;
  onBegin: () => void;
}

export default function WelcomeSection({ jobTitle, company, questionCount, onBegin }: Props) {
  return (
    <div className="two-col">
      <div className="welcome-main">
        {jobTitle && (
          <div className="welcome-role-tag">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="1" y="4" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M4 4V3a2.5 2.5 0 0 1 5 0v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            {jobTitle}{company ? ` · ${company}` : ""}
          </div>
        )}

        <h2 className="welcome-heading">
          Ready to begin<br />your interview?
        </h2>

        <p className="welcome-sub">
          {questionCount} tailored question{questionCount !== 1 ? "s" : ""} await.
          Answer by voice, get scored by AI.
        </p>

        <div className="welcome-features">
          {FEATS.map(f => (
            <div className="welcome-feat" key={f.title}>
              <div className="feat-icon">{f.icon}</div>
              <div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn-begin" onClick={onBegin}>
          Begin Interview
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9h10M10 5l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="welcome-side">
        <div className="tips-card">
          <div className="tips-title">Before you start</div>
          {TIPS.map((tip, i) => (
            <div className="tip-row" key={i}>
              <div className="tip-num">{i + 1}</div>
              <div className="tip-text">{tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const FEATS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="7" y="1" width="4" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 9a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="9" y1="15" x2="9" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Voice Recording",
    desc: "Answer naturally with your microphone",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Instant Evaluation",
    desc: "AI scores every answer in seconds",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="2" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <line x1="5" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="5" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "Full Report",
    desc: "Detailed feedback after completion",
  },
];

const TIPS = [
  "Find a quiet place with a working microphone",
  "Speak in complete sentences for better scores",
  "Use the Listen button to hear each question read aloud",
  "You can re-record your answer before submitting",
];
