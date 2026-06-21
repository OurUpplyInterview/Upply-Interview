import { useEffect, useState } from "react";
import type { QuestionResult } from "../types/interview";

interface Props {
  results: QuestionResult[];
}

function scoreColor(v: number) {
  return v >= 7 ? "#34A853" : v >= 4 ? "#F59E0B" : "#EF4444";
}
function scoreLabel(v: number) {
  return v >= 7 ? "Strong" : v >= 4 ? "Good" : "Needs work";
}

export default function SummarySection({ results: initialResults }: Props) {
  const [results, setResults] = useState<QuestionResult[]>(initialResults);

  // Poll every 3s until all scores are ready
  useEffect(() => {
    setResults(initialResults);
    if (initialResults.every(r => r.score >= 0)) return;
    const interval = setInterval(() => {
      setResults([...initialResults]);
      if (initialResults.every(r => r.score >= 0)) clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [initialResults]);

  const scored  = results.filter(r => r.score >= 0);
  const pending = results.length - scored.length;
  const scores  = scored.map(r => r.score);
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
          <div className="summary-subtitle">
            {pending > 0
              ? `Scoring ${pending} answer${pending > 1 ? "s" : ""}…`
              : "Your AI performance report is ready"}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="summary-stats">
        <StatBox value={scores.length ? avg.toFixed(1) : "…"} label="Avg Score" color={scoreColor(avg)} />
        <StatBox value={scores.length ? String(best) : "…"}   label="Best"      color="#34A853" />
        <StatBox value={scores.length ? String(worst) : "…"}  label="Lowest"    color={scoreColor(worst)} />
        <StatBox value={`${strong}/${results.length}`} label="Strong" color="#1E1D4C" />
      </div>

      {/* Per-question breakdown */}
      <div className="summary-breakdown-title">Detailed Breakdown</div>

      <div className="summary-cards">
        {results.map((r, i) => (
          <div className="result-card" key={i} style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="result-card-top">
              {r.score < 0 ? (
                <div className="result-score" style={{ color: "#9998B8" }}>
                  <span className="result-score-num">…</span>
                  <span className="result-score-den">/10</span>
                </div>
              ) : (
                <div className="result-score" style={{ color: scoreColor(r.score) }}>
                  <span className="result-score-num">{r.score}</span>
                  <span className="result-score-den">/10</span>
                </div>
              )}
              <div className="result-meta">
                <div className="result-badge" style={{
                  background: r.score < 0 ? "#f0f0f0" : `${scoreColor(r.score)}18`,
                  color: r.score < 0 ? "#9998B8" : scoreColor(r.score)
                }}>
                  {r.score < 0 ? "Scoring…" : scoreLabel(r.score)}
                </div>
                <div className="result-q">Q{i + 1} · {r.question}</div>
              </div>
            </div>
            <div className="result-feedback">{r.feedback}</div>
            {r.tip && (
              <div className="result-tip">
                <span>💡</span>
                <span>{r.tip}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="summary-actions">
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
