import React from 'react';
import type { ResultItem, ResultSummary } from '../interfaces';

// ── Toast ─────────────────────────────────────────────────────────────────
interface ToastProps { message: string; type: string; visible: boolean; }

export const Toast: React.FC<ToastProps> = ({ message, type, visible }) => (
  <div style={{
    position: 'fixed', bottom: 28, left: '50%',
    transform: `translateX(-50%) translateY(${visible ? '0' : '80px'})`,
    background: '#fff',
    border: `1px solid ${type === 'success' ? '#9FE1CB' : type === 'error' ? '#F7C1C1' : type === 'info' ? 'rgba(45,43,107,.25)' : '#CACAE0'}`,
    color:  type === 'success' ? '#1D9E75' : type === 'error' ? '#E85555' : type === 'info' ? '#2D2B6B' : '#1E1C4A',
    borderRadius: 10, padding: '11px 22px', fontSize: 13,
    boxShadow: '0 8px 28px rgba(0,0,0,.1)', transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
    zIndex: 999, whiteSpace: 'nowrap', pointerEvents: 'none',
  }}>
    {message}
  </div>
);

// ── Confirm Modal ─────────────────────────────────────────────────────────
interface ConfirmModalProps {
  open: boolean;
  title: string;
  body: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, title, body, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#2D2B6B', marginBottom: 8 }}>{title}</h2>
        <p style={{ fontSize: 13, color: '#6B6A8E', lineHeight: 1.65, marginBottom: 22 }}>{body}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={cancelBtn}>Cancel</button>
          <button onClick={onConfirm} style={confirmBtn}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

// ── Results Modal ─────────────────────────────────────────────────────────
interface ResultsModalProps {
  open: boolean;
  candidateName: string;
  summary: ResultSummary | null;
  results: ResultItem[];
  onClose: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({ open, candidateName, summary, results, onClose }) => {
  if (!open || !summary) return null;
  const avgColor = summary.avg_score >= 7 ? '#1D9E75' : summary.avg_score >= 4 ? '#F0A030' : '#E85555';
  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: 580 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#2D2B6B', marginBottom: 16 }}>
          Results — {candidateName}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
          {[
            { val: summary.avg_score, label: 'Avg',    color: avgColor },
            { val: summary.best,      label: 'Best',   color: '#1D9E75' },
            { val: summary.worst,     label: 'Lowest', color: '#E85555' },
            { val: `${summary.strong}/${summary.total}`, label: 'Strong', color: '#2D2B6B' },
          ].map(s => (
            <div key={s.label} style={{ background: '#F4F4F8', border: '1px solid #E2E2EE', borderRadius: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-.5px' }}>{s.val}</div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9998B8', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.map((r, i) => {
            const scoreColor = r.score >= 7 ? '#1D9E75' : r.score >= 4 ? '#F0A030' : '#E85555';
            const scoreBg    = r.score >= 7 ? '#E1F5EE'  : r.score >= 4 ? '#FEF3E2'  : '#FCE8E8';
            return (
              <div key={i} style={{ background: '#F4F4F8', border: '1px solid #E2E2EE', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, background: scoreBg, color: scoreColor,
                    border: `2px solid ${scoreColor}44`,
                  }}>{r.score}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#2D2B6B', lineHeight: 1.4 }}>Q{i+1}: {r.question}</div>
                </div>
                <div style={{ fontSize: 12, color: '#6B6A8E', lineHeight: 1.5 }}>{r.feedback}</div>
                <div style={{ fontSize: 11, color: '#2D2B6B', background: '#EEEDFB', borderRadius: 6, padding: '7px 10px', marginTop: 7 }}>💡 {r.tip}</div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={cancelBtn}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ── Shared styles ─────────────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  background: 'rgba(29,28,74,.45)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
};
const modalStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #E2E2EE', borderRadius: 18,
  padding: 32, width: '100%', maxWidth: 460,
  boxShadow: '0 20px 60px rgba(0,0,0,.12)',
};
const cancelBtn: React.CSSProperties = {
  padding: '9px 20px', border: '1.5px solid #CACAE0', borderRadius: 9,
  background: 'transparent', color: '#6B6A8E', fontFamily: 'Inter, sans-serif',
  fontSize: 13, cursor: 'pointer',
};
const confirmBtn: React.CSSProperties = {
  padding: '9px 22px', background: '#2D2B6B', border: 'none', borderRadius: 9,
  color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
