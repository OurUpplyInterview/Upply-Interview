import React from 'react';
import type { Applicant } from '../interfaces';

interface ApplicantTableProps {
  applicants: Applicant[];
  loading: boolean;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onSendOne: (appId: string, email: string, name: string) => void;
  onViewResults: (appId: string) => void;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string; dot: string }> = {
  COMPLETED:   { bg: '#E1F5EE', color: '#1D9E75', label: 'Completed',   dot: '#1D9E75' },
  IN_PROGRESS: { bg: '#E8F0FE', color: '#1A73E8', label: 'In progress', dot: '#1A73E8' },
  INVITED:     { bg: '#EEEDFB', color: '#2D2B6B', label: 'Link sent',   dot: '#6C63FF' },
  PENDING:     { bg: '#FEF3E2', color: '#A06010', label: 'Pending',     dot: '#F0A030' },
};

function getStatus(app: Applicant) {
  return ((app.status || app.interviewStatus || 'PENDING') as string).toUpperCase();
}

export const ApplicantTable: React.FC<ApplicantTableProps> = ({
  applicants, loading, selected, onToggle, onToggleAll, onSendOne, onViewResults,
}) => {
  const allChecked = applicants.length > 0 && applicants.every(
    a => selected.has(String(a.id || a.applicationId))
  );

  if (loading) return (
    <div style={{ textAlign:'center', padding:'56px 20px', color:'#9998B8', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ fontSize:24, marginBottom:10 }}>⏳</div>
      <div style={{ fontWeight:600, color:'#6B6A8E' }}>Loading applicants…</div>
    </div>
  );

  if (!applicants.length) return (
    <div style={{ textAlign:'center', padding:'64px 20px', color:'#9998B8', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ fontSize:28, marginBottom:10 }}>👥</div>
      <div style={{ fontWeight:600, color:'#6B6A8E' }}>No applicants yet</div>
      <div style={{ fontSize:12, marginTop:4 }}>Applicants will appear here once they apply</div>
    </div>
  );

  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'Inter',sans-serif" }}>
      <thead>
        <tr style={{ background:'#F8F8FC' }}>
          <th style={thStyle}>
            <input
              type="checkbox" checked={allChecked}
              onChange={e => onToggleAll(e.target.checked)}
              style={{ width:15, height:15, accentColor:'#2D2B6B', cursor:'pointer' }}
            />
          </th>
          {['Applicant', 'Applied', 'Match', 'Status', 'Action'].map(h => (
            <th key={h} style={thStyle}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {applicants.map((app, i) => {
          const name    = app.applicantName || app.candidateName || app.fullName || app.name || `Applicant ${i+1}`;
          const email   = app.applicantEmail || app.candidateEmail || app.email || '';
          const appId   = String(app.id || app.applicationId || '');
          const date    = app.appliedAt || app.createdAt || app.applicationDate;
          const match   = app.matchPercentage || app.matchScore || app.score || app.match;
          const status  = getStatus(app);
          const dateStr = date ? new Date(date).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : '—';
          const matchStr= match != null ? `${Math.round(match as number)}%` : '—';
          const pill    = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
          const isChecked = selected.has(appId);

          return (
            <tr
              key={appId || i}
              style={{
                borderBottom: '1px solid #F0F0F8',
                background: isChecked ? '#F8F8FF' : 'transparent',
                transition: 'background .15s',
              }}
              onMouseEnter={e => { if (!isChecked) (e.currentTarget as HTMLTableRowElement).style.background = '#FAFAFA'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = isChecked ? '#F8F8FF' : 'transparent'; }}
            >
              <td style={tdStyle}>
                <input
                  type="checkbox" checked={isChecked}
                  onChange={() => onToggle(appId)}
                  style={{ width:15, height:15, accentColor:'#2D2B6B', cursor:'pointer' }}
                />
              </td>
              <td style={tdStyle}>
                <div style={{ fontWeight:600, color:'#1E1D4C', fontSize:13 }}>{name}</div>
                <div style={{ fontSize:11, color:'#9998B8', marginTop:2 }}>{email}</div>
              </td>
              <td style={{ ...tdStyle, fontSize:12, color:'#9998B8' }}>{dateStr}</td>
              <td style={{ ...tdStyle, fontWeight:700, color:'#1D9E75', fontSize:13 }}>{matchStr}</td>
              <td style={tdStyle}>
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:5,
                  padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:700,
                  background: pill.bg, color: pill.color,
                }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:pill.dot, display:'inline-block', flexShrink:0 }} />
                  {pill.label}
                </span>
              </td>
              <td style={tdStyle}>
                <div style={{ display:'flex', gap:6 }}>
                  <button
                    onClick={() => onSendOne(appId, email, name)}
                    style={btnSm}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F4F8'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
                  >Send link</button>
                  {(status === 'COMPLETED' || status === 'IN_PROGRESS') && (
                    <button
                      onClick={() => onViewResults(appId)}
                      style={{ ...btnSm, background:'#E1F5EE', color:'#1D9E75', borderColor:'#9FE1CB' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#C8EFE1'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E1F5EE'; }}
                    >Results</button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

const thStyle: React.CSSProperties = {
  padding: '12px 18px', textAlign: 'left', fontSize: 10, fontWeight: 700,
  letterSpacing: '.12em', textTransform: 'uppercase', color: '#9998B8',
  background: '#F8F8FC', borderBottom: '1.5px solid #E2E2EE',
};
const tdStyle: React.CSSProperties = {
  padding: '14px 18px', fontSize: 13, verticalAlign: 'middle',
};
const btnSm: React.CSSProperties = {
  padding: '7px 14px', border: '1.5px solid #E2E2EE', borderRadius: 9,
  background: '#fff', color: '#1E1C4A', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: "'Inter', sans-serif", transition: 'background .15s',
};
