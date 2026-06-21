import React from 'react';
import type { User } from '../interfaces';

interface CreateInterviewPageProps {
  user: User | null;
  onStart: () => void;
  onBrowse?: () => void;
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

@keyframes float {
  0%   { transform: translateY(0px) translateX(0px); }
  50%  { transform: translateY(-20px) translateX(10px); }
  100% { transform: translateY(0px) translateX(0px); }
}
@keyframes floatSlow {
  0%   { transform: translateY(0px); }
  50%  { transform: translateY(-30px); }
  100% { transform: translateY(0px); }
}
@keyframes floatRotate {
  0%   { transform: rotate(0deg) translateY(0); }
  50%  { transform: rotate(180deg) translateY(-15px); }
  100% { transform: rotate(360deg) translateY(0); }
}

.shape { position: absolute; pointer-events: none; }

.create-layout {
  min-height: calc(100vh - 60px);
  display: flex;
  font-family: 'Poppins', sans-serif;
}

.create-left {
  flex: 1;
  padding: 60px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #FFFFFF;
  position: relative;
  overflow: hidden;
}

.create-right {
  flex: 1;
  padding: 60px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #EEEDF6;
  position: relative;
  overflow: hidden;
}

.create-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .create-layout {
    flex-direction: column;
  }
  .create-left {
    padding: 40px 24px 32px;
    min-height: auto;
  }
  .create-right {
    padding: 32px 24px 48px;
  }
  .create-buttons {
    flex-direction: column;
  }
  .create-buttons button {
    width: 100%;
    justify-content: center;
  }
}
`;

const stepNumbers = ['1', '2', '3'];

const steps = [
  { label: 'Select a Job',       desc: 'Choose from your active job postings' },
  { label: 'Select Candidates',  desc: 'Pick candidates and send them the interview link' },
  { label: 'AI Takes Over',      desc: 'Screening, scoring & personalised feedback — automatically' },
];

export const CreateInterviewPage: React.FC<CreateInterviewPageProps> = ({ onStart, onBrowse }) => {
  return (
    <>
      <style>{styles}</style>

      <div className="create-layout">

        {/* LEFT */}
        <div className="create-left">
          <div className="shape" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #C7C9F4', top: 80, left: 40, animation: 'float 6s ease-in-out infinite' }} />
          <div className="shape" style={{ width: 24, height: 24, borderRadius: '50%', background: '#E0E7FF', top: 140, left: 120, animation: 'floatSlow 8s ease-in-out infinite' }} />
          <div className="shape" style={{ width: 18, height: 18, borderRadius: '50%', background: '#A7F3D0', top: 200, left: 60, animation: 'float 7s ease-in-out infinite' }} />
          <div className="shape" style={{ width: 14, height: 14, background: '#34A853', borderRadius: '50%', bottom: 120, left: 80, animation: 'floatSlow 9s ease-in-out infinite' }} />

          <h1 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, lineHeight: 1.1, color: '#1E1D4C', marginBottom: 20, zIndex: 1 }}>
            Ready to interview your next candidate?
          </h1>

          <p style={{ fontSize: 16, color: '#6B7280', maxWidth: 400, zIndex: 1 }}>
            Three simple steps. Zero manual effort.
          </p>
        </div>

        {/* RIGHT */}
        <div className="create-right">
          <div className="shape" style={{ width: 0, height: 0, borderLeft: '25px solid transparent', borderRight: '25px solid transparent', borderBottom: '40px solid #A7F3D0', top: 60, right: 80, animation: 'floatRotate 12s linear infinite' }} />
          <div className="shape" style={{ width: 16, height: 16, background: '#C7C9F4', borderRadius: 4, right: 40, top: '50%', animation: 'float 5s ease-in-out infinite' }} />
          <div className="shape" style={{ width: 30, height: 30, borderRadius: '50%', background: '#E0E7FF', bottom: 40, right: 120, animation: 'floatSlow 9s ease-in-out infinite' }} />

          <div style={{ marginBottom: 32, zIndex: 1 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{
                  flexShrink: 0, marginTop: 2,
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#34A853', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 15, fontFamily: 'Poppins, sans-serif',
                }}>
                  {stepNumbers[i]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#1E1D4C' }}>{step.label}</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="create-buttons" style={{ zIndex: 1 }}>
            <button
              onClick={onStart}
              style={{
                padding: '16px 36px', borderRadius: 50, border: 'none',
                background: '#34A853', color: '#fff', fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 6px 20px rgba(52,168,83,0.25)',
                fontSize: 15,
              }}
            >
              Create Interview →
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
