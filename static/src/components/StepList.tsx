import type { Question } from "../types/interview";

interface Props {
  questions: Question[];
  currentIdx: number;
  answeredCount: number;
}

export default function StepList({ questions, currentIdx, answeredCount }: Props) {
  const pct = Math.round((answeredCount / Math.max(questions.length, 1)) * 100);

  return (
    <div className="steplist-card">
      <div className="steplist-header">
        <span className="steplist-title">Progress</span>
        <span className="steplist-count">{answeredCount}/{questions.length}</span>
      </div>

      <div className="steplist-bar-track">
        <div className="steplist-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="steplist-items">
        {questions.map((q, i) => {
          const done    = i < answeredCount;
          const current = i === currentIdx;
          return (
            <div
              className={`step-item${done ? " step-done" : current ? " step-current" : " step-pending"}`}
              key={i}
            >
              <div className="step-num">
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : i + 1}
              </div>
              <div className="step-q">
                {q.question.length > 52 ? q.question.slice(0, 52) + "…" : q.question}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating shapes in the empty card space */}
      <div className="sl-shapes-zone" aria-hidden="true">
        <div className="sl-sh sl-a1" style={{ width:52, height:52, borderRadius:"50%", border:"2px solid rgba(61,190,138,0.35)", top:"6%", right:"10%" }} />
        <div className="sl-sh sl-a2" style={{ width:20, height:20, borderRadius:"50%", border:"1.5px solid rgba(120,120,200,0.22)", top:"18%", left:"16%" }} />
        <div className="sl-sh sl-a3" style={{ width:13, height:13, borderRadius:"50%", background:"#3DBE8A", opacity:0.8, bottom:"20%", right:"12%" }} />
        <div className="sl-sh sl-a2" style={{ width:9, height:9, borderRadius:"50%", background:"#3DBE8A", opacity:0.55, bottom:"8%", left:"10%" }} />
        <div className="sl-sh sl-a4" style={{ width:0, height:0, borderLeft:"10px solid transparent", borderRight:"10px solid transparent", borderBottom:"17px solid rgba(61,190,138,0.6)", top:"8%", left:"12%", background:"transparent" }} />
        <div className="sl-sh sl-a3" style={{ width:8, height:8, background:"rgba(110,110,200,0.22)", borderRadius:2, bottom:"40%", right:"24%" }} />
        <div className="sl-sh sl-a1" style={{ width:7, height:7, borderRadius:"50%", background:"rgba(110,110,200,0.35)", top:"48%", left:"50%" }} />
      </div>

      <style>{`
        .sl-shapes-zone {
          flex: 1;
          position: relative;
          min-height: 130px;
          margin-top: 0.5rem;
        }
        .sl-sh { position: absolute; }

        @keyframes sl-f1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes sl-f2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
        @keyframes sl-f3 { 0%,100%{transform:translateY(0) rotate(15deg)} 50%{transform:translateY(-8px) rotate(28deg)} }
        @keyframes sl-f4 { 0%,100%{transform:translateY(0) rotate(20deg)} 50%{transform:translateY(7px) rotate(8deg)} }

        .sl-a1 { animation: sl-f1 5s ease-in-out infinite; }
        .sl-a2 { animation: sl-f2 6.5s ease-in-out infinite; }
        .sl-a3 { animation: sl-f3 7s ease-in-out infinite; }
        .sl-a4 { animation: sl-f4 5.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
