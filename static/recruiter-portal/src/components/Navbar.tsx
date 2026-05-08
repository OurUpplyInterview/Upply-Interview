import React from 'react';
import type { User } from '../interfaces';
import { UpplyLogo } from './UpplyLogo';

interface NavbarProps {
  user: User | null;
  onSignOut: () => void;
  onCreateInterview?: () => void;
  onNavigateToJobs?: () => void;
  onNavigateToInterviews?: () => void;
  activePage?: 'jobs' | 'interviews';
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNavigateToJobs,
  onNavigateToInterviews,
  activePage,
}) => {
  const initial = (user?.name || user?.email || 'U')[0].toUpperCase();

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #E2E2EE',
      height: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 56px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <style>{`
        .nb-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 16px; border-radius: 8px;
          font-size: 13px; font-weight: 500;
          transition: background .15s, color .15s;
          background: none; border: none;
          font-family: 'Inter', sans-serif; cursor: pointer; color: #9998B8;
          text-decoration: none;
        }
        .nb-btn:hover { background: #EBEBF8; color: #1E1D4C; }
        .nb-btn.active { background: #E4F7F0; color: #0f6e56; font-weight: 700; }
        .nb-btn.danger { color: #E85555; }
        .nb-btn.danger:hover { background: #FFF0F0; color: #E85555; }
        .nb-divider { width: 1px; height: 22px; background: #E2E2EE; margin: 0 8px; flex-shrink: 0; }
        .nb-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: #1E1D4C; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0;
        }
      `}</style>

      {/* LOGO */}
      <a
        href="https://upply.tech"
        target="_blank"
        rel="noreferrer"
        style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
      >
        <UpplyLogo height={56} />
      </a>

      {/* RIGHT SIDE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          className={`nb-btn${activePage === 'jobs' ? ' active' : ''}`}
          onClick={onNavigateToJobs}
        >
          Jobs
        </button>
        <button
          className={`nb-btn${activePage === 'interviews' ? ' active' : ''}`}
          onClick={onNavigateToInterviews}
        >
          Interviews
        </button>
        <div className="nb-divider" />
        <a
          href="https://www.upply.tech/profile"
          target="_blank"
          rel="noreferrer"
          className="nb-btn"
          style={{ gap: 8 }}
        >
          <div className="nb-avatar">{initial}</div>
          My Profile
        </a>
        <div className="nb-divider" />
        <button className="nb-btn danger" onClick={onSignOut}>Sign out</button>
      </div>
    </nav>
  );
};