import type { QuestionResult } from "../types/interview";

interface Props {
  results: QuestionResult[];
  onRetry: () => void;
}

function scoreColor(v: number) {
  return v >= 7 ? "#34A853" : v >= 4 ? "#F59E0B" : "#EF4444";
}
function scoreLabel(v: number) {
  return v >= 7 ? "Strong" : v >= 4 ? "Good" : "Needs work";
}

export default function SummarySection({ results, onRetry }: Props) {
  const scores  = results.map(r => r.score);
  const avg     = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const best    = scores.length ? Math.max(...scores) : 0;
  const worst   = scores.length ? Math.min(...scores) : 0;
  const strong  = scores.filter(s => s >= 7).length;

  return (
    <div className="summary-wrap">
      {/* Header */}
      <div className="summary-header">
        <div className="summary-trophy">🏆</div>
        <div>
          <div className="summary-title">Interview Complete</div>
          <div className="summary-subtitle">Your AI performance report is ready</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="summary-stats">
        <StatBox value={avg.toFixed(1)} label="Avg Score" color={scoreColor(avg)} />
        <StatBox value={String(best)}   label="Best"      color="#34A853" />
        <StatBox value={String(worst)}  label="Lowest"    color={scoreColor(worst)} />
        <StatBox value={`${strong}/${results.length}`} label="Strong" color="#1E1D4C" />
      </div>

      {/* Per-question breakdown */}
      <div className="summary-breakdown-title">Detailed Breakdown</div>

      <div className="summary-cards">
        {results.map((r, i) => (
          <div className="result-card" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="result-card-top">
              <div className="result-score" style={{ color: scoreColor(r.score) }}>
                <span className="result-score-num">{r.score}</span>
                <span className="result-score-den">/10</span>
              </div>
              <div className="result-meta">
                <div className="result-badge" style={{ background: `${scoreColor(r.score)}18`, color: scoreColor(r.score) }}>
                  {scoreLabel(r.score)}
                </div>
                <div className="result-q">Q{i + 1} · {r.question}</div>
              </div>
            </div>
            <div className="result-feedback">{r.feedback}</div>
            <div className="result-tip">
              <span>💡</span>
              <span>{r.tip}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="summary-actions">
        <button className="btn-retry" onClick={onRetry}>↩ Try Again</button>
        <button className="btn-exit" onClick={() => window.location.reload()}>Close Session</button>
      </div>
    </div>
  );
}

function StatBox({ value, label, color }: { value: string; color: string; label: string }) {
  return (
    <div className="stat-box">
      <div className="stat-val" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
