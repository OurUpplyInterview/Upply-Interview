import React from 'react';
import type { Job } from '../interfaces';

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const title    = job.title || 'Untitled';
  const company  = job.organizationName || job.companyName || (job as any).company || '';
  const type     = job.type || job.seniority || job.jobType || '';
  const location = job.location || (job as any).city || (job as any).country || '';

  return (
    <div
      onClick={() => onClick(job)}
      style={{
        background: '#fff',
        border: '1.5px solid #E2E2EE',
        borderRadius: 16,
        padding: 24,
        cursor: 'pointer',
        transition: 'all .2s ease',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = '0 8px 32px rgba(45,43,107,.13)';
        el.style.transform = 'translateY(-3px)';
        el.style.borderColor = '#CACAE0';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = 'none';
        el.style.transform = 'translateY(0)';
        el.style.borderColor = '#E2E2EE';
      }}
    >
      {/* top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: 'linear-gradient(90deg, #1E1D4C, #3ECFA0)',
      }} />

      {/* Title */}
      <div style={{
        fontFamily: "'Poppins', sans-serif",
        fontSize: 15, fontWeight: 700, color: '#1E1D4C',
        marginBottom: 4, marginTop: 4,
        lineHeight: 1.3,
      }}>{title}</div>

      {/* Company */}
      {company && (
        <div style={{ fontSize: 12, color: '#9998B8', marginBottom: 14, fontWeight: 500 }}>{company}</div>
      )}

      {/* Tags */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {type && (
          <span style={{
            padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: '#EEEDFB', color: '#2D2B6B', letterSpacing: '.01em',
          }}>{type}</span>
        )}
        {location && (
          <span style={{
            padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: '#E1F5EE', color: '#1D9E75', letterSpacing: '.01em',
          }}>{location}</span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #1E1D4C, #2D2B6B)',
          color: '#fff', fontSize: 12, fontWeight: 600,
          borderRadius: 10, letterSpacing: '.01em',
        }}>View →</span>
      </div>
    </div>
  );
};

export const JobCardSkeleton: React.FC = () => (
  <div style={{
    background: '#fff', border: '1.5px solid #E2E2EE',
    borderRadius: 16, padding: 24, overflow: 'hidden', position: 'relative',
  }}>
    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'#E2E2EE' }} />
    {[['70%', 16], ['45%', 12], ['55%', 12], ['30%', 32]].map(([w, h], i) => (
      <div key={i} style={{
        width: w as string, height: h as number, borderRadius: 8,
        marginBottom: i < 3 ? 12 : 0, marginTop: i === 0 ? 4 : 0,
        background: 'linear-gradient(90deg,#ebebeb 25%,#f5f5f5 50%,#ebebeb 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }} />
    ))}
  </div>
);
