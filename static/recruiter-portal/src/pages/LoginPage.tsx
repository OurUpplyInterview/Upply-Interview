import React, { useState } from 'react';
import { UpplyLogo } from '../components/UpplyLogo';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean }>;
  loading: boolean;
  error: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, loading, error }) => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) return;
    await onLogin(email, password);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @media (max-width: 640px) {
          .login-left { display: none !important; }
          .login-right {
            width: 100% !important;
            padding: 40px 24px !important;
          }
        }
      `}</style>

      {/* LEFT PANEL */}
      <div className="login-left" style={{
        flex: 1,
        background: 'linear-gradient(160deg, #1E1D4C 0%, #2D2B6B 60%, #1a3a4a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(62,207,160,.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(62,207,160,.05)', pointerEvents: 'none' }} />

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#3ECFA0', marginBottom: 16 }}>
            Welcome to
          </div>
          <div style={{ fontSize: 68, fontWeight: 800, color: '#fff', lineHeight: 1.0, letterSpacing: '-3px', marginBottom: 28 }}>
            Recruiter<br />Portal
          </div>
          <div style={{ width: 56, height: 3, background: 'linear-gradient(90deg, #3ECFA0, transparent)', borderRadius: 2, margin: '0 auto 32px' }} />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,.45)', lineHeight: 1.7, maxWidth: 320, margin: '0 auto' }}>
            Automate your technical interviews with AI-powered screening, scoring, and personalised candidate feedback.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="login-right" style={{
        width: 480,
        background: '#EEEEF6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 24, right: 32 }}>
          <a href="https://upply.tech" target="_blank" rel="noreferrer" style={{ display: 'flex' }}>
            <UpplyLogo height={48} />
          </a>
        </div>

        <div style={{ width: '100%', animation: 'fadeUp .4s ease both' }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1E1D4C', marginBottom: 6 }}>Sign in</h2>
            <p style={{ fontSize: 13, color: '#9998B8' }}>Enter your credentials to access the portal</p>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" value={email} placeholder="you@company.com"
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#2D2B6B'; e.target.style.boxShadow = '0 0 0 3px rgba(45,43,107,.08)'; }}
              onBlur={e =>  { e.target.style.borderColor = '#E2E2EE'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password" value={password} placeholder="••••••••"
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#2D2B6B'; e.target.style.boxShadow = '0 0 0 3px rgba(45,43,107,.08)'; }}
              onBlur={e =>  { e.target.style.borderColor = '#E2E2EE'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: loading ? '#6B6A8E' : 'linear-gradient(135deg, #1E1D4C, #2D2B6B)',
              color: '#fff', border: 'none', borderRadius: 12, padding: '14px 22px',
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'all .18s',
              opacity: (!email || !password) ? .5 : 1,
              boxShadow: '0 4px 16px rgba(30,29,76,.25)',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>

          {error && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: '#FCE8E8', border: '1px solid #F7C1C1', borderRadius: 8, fontSize: 13, color: '#E85555' }}>
              {error}
            </div>
          )}

          <p style={{ marginTop: 32, fontSize: 11, color: '#C0BFD8', textAlign: 'center' }}>
            Upply AI Interview System · Recruiter Portal
          </p>
        </div>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700,
  letterSpacing: '.1em', textTransform: 'uppercase',
  color: '#6B6A8E', marginBottom: 7,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: '#fff',
  border: '1.5px solid #E2E2EE', borderRadius: 10,
  color: '#1E1C4A', fontFamily: 'Inter, sans-serif',
  fontSize: 14, outline: 'none',
  transition: 'border-color .2s, box-shadow .2s', boxSizing: 'border-box',
};
