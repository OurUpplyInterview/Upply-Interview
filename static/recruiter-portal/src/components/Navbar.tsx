import React, { useState, useRef, useEffect } from 'react';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid #E2E2EE',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <style>{`
        .nb-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 12px; border-radius: 8px;
          font-size: 13px; font-weight: 500;
          transition: background .15s, color .15s;
          background: none; border: none;
          font-family: 'Inter', sans-serif; cursor: pointer; color: #9998B8;
          text-decoration: none; white-space: nowrap;
        }
        .nb-btn:hover { background: #EBEBF8; color: #1E1D4C; }
        .nb-btn.active { background: #E4F7F0; color: #0f6e56; font-weight: 700; }
        .nb-divider { width: 1px; height: 22px; background: #E2E2EE; margin: 0 4px; flex-shrink: 0; }
        .nb-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: #1E1D4C; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; flex-shrink: 0; cursor: pointer;
          border: 2px solid transparent; transition: border-color .15s;
        }
        .nb-avatar:hover { border-color: #2D2B6B; }
        .nb-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: #fff;
          border: 1px solid #E2E2EE;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          min-width: 180px;
          overflow: hidden;
          z-index: 200;
          animation: fadeUp .15s ease both;
        }
        .nb-dropdown-item {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 16px; font-size: 13px; font-weight: 500;
          color: #1E1D4C; cursor: pointer; text-decoration: none;
          background: none; border: none; width: 100%;
          font-family: 'Inter', sans-serif; transition: background .15s;
          text-align: left;
        }
        .nb-dropdown-item:hover { background: #F4F4F8; }
        .nb-dropdown-item.danger { color: #E85555; }
        .nb-dropdown-item.danger:hover { background: #FFF0F0; }
        .nb-dropdown-divider { height: 1px; background: #E2E2EE; margin: 4px 0; }
      `}</style>

      {/* LOGO */}
      <a
        href="https://upply.tech"
        target="_blank"
        rel="noreferrer"
        style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}
      >
        <UpplyLogo height={44} />
      </a>

      {/* RIGHT SIDE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

        {/* PROFILE AVATAR WITH DROPDOWN */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            className="nb-avatar"
            onClick={() => setDropdownOpen(o => !o)}
            title="Profile menu"
          >
            {initial}
          </div>

          {dropdownOpen && (
            <div className="nb-dropdown">
              {/* User info */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E2EE' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1D4C' }}>
                  {user?.name || 'Recruiter'}
                </div>
                <div style={{ fontSize: 11, color: '#9998B8', marginTop: 2 }}>
                  {user?.email || ''}
                </div>
              </div>

              <a
                href="https://www.upply.tech/profile"
                target="_blank"
                rel="noreferrer"
                className="nb-dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                👤 My Profile
              </a>

              <div className="nb-dropdown-divider" />

              <button
                className="nb-dropdown-item danger"
                onClick={() => { setDropdownOpen(false); onSignOut(); }}
              >
                🚪 Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
