import React, { useEffect, useState } from 'react';
import type { Job, User } from '../interfaces';
import { useJobs } from '../hooks/useJobs';
import { JobCard } from '../components/JobCard';

interface JobsDashPageProps {
  onSelectJob: (job: Job) => void;
  onNavigateToInterviews: () => void;
  onSignOut: () => void;
  user: User | null;
}

const JOBS_PER_PAGE = 10;

function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export const JobsDashPage: React.FC<JobsDashPageProps> = ({
  onSelectJob,
  onNavigateToInterviews,
  onSignOut,
  user,
}) => {
  const { jobs, loading, fetchJobs } = useJobs();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [searchFocused, setSearchFocused] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const totalCount    = useCountUp(loading ? 0 : jobs.length);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);
  useEffect(() => { setPage(1); }, [query]);

  const goToPage = (p: number) => {
    setPage(p);
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filtered = query
    ? jobs.filter(j =>
        (j.title || '').toLowerCase().includes(query.toLowerCase()) ||
        (j.organizationName || j.companyName || '').toLowerCase().includes(query.toLowerCase())
      )
    : jobs;

  const totalPages = Math.ceil(filtered.length / JOBS_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * JOBS_PER_PAGE, page * JOBS_PER_PAGE);
  const initial    = (user?.name || user?.email || 'U')[0].toUpperCase();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden',
      background: '#F0F2F5', fontFamily: "'Inter', sans-serif",
      position: 'relative',
    }}>
      {/* ── Global animated background shapes ── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position:'absolute', width:380, height:380, borderRadius:'50%', background:'radial-gradient(circle, rgba(30,29,76,.07) 0%, transparent 70%)', top:'-80px', left:'-60px', animation:'floatA 14s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:260, height:260, borderRadius:'40% 60% 60% 40% / 40% 40% 60% 60%', background:'rgba(34,197,94,.05)', top:'15%', left:'12%', animation:'floatB 9s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:180, height:180, borderRadius:'50%', background:'rgba(99,102,241,.06)', top:'40%', left:'5%', animation:'floatC 11s ease-in-out infinite reverse' }}/>
        <div style={{ position:'absolute', width:120, height:120, borderRadius:'20px', background:'rgba(30,29,76,.04)', bottom:'15%', left:'8%', animation:'floatD 7s linear infinite' }}/>
        <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,.05) 0%, transparent 65%)', top:'-100px', right:'20%', animation:'floatA 18s ease-in-out infinite reverse' }}/>
        <div style={{ position:'absolute', width:220, height:220, borderRadius:'50%', background:'rgba(30,29,76,.05)', top:'30%', right:'5%', animation:'floatB 12s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:140, height:140, borderRadius:'30% 70% 50% 50% / 50% 50% 70% 30%', background:'rgba(99,102,241,.05)', bottom:'25%', right:'15%', animation:'floatC 8s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:80, height:80, borderRadius:'50%', background:'rgba(34,197,94,.06)', bottom:'10%', right:'40%', animation:'floatD 10s ease-in-out infinite reverse' }}/>
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,.06) 0%, transparent 70%)', bottom:'-60px', left:'35%', animation:'floatA 16s ease-in-out infinite' }}/>
        <div style={{ position:'absolute', width:60, height:60, borderRadius:'12px', background:'rgba(30,29,76,.04)', top:'55%', left:'50%', animation:'floatB 6s ease-in-out infinite' }}/>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -600px 0; }
          100% { background-position:  600px 0; }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(.9); }
          70%  { transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes floatA {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); }
          33%  { transform: translate(18px,-22px) rotate(60deg) scale(1.08); }
          66%  { transform: translate(-12px,14px) rotate(120deg) scale(0.94); }
          100% { transform: translate(0,0) rotate(0deg) scale(1); }
        }
        @keyframes floatB {
          0%   { transform: translate(0,0) rotate(0deg); }
          50%  { transform: translate(-20px,16px) rotate(-90deg); }
          100% { transform: translate(0,0) rotate(0deg); }
        }
        @keyframes floatC {
          0%   { transform: translate(0,0) scale(1); }
          40%  { transform: translate(14px,-10px) scale(1.15); }
          80%  { transform: translate(-8px,18px) scale(0.88); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes floatD {
          0%   { transform: translate(0,0) rotate(0deg); }
          60%  { transform: translate(-16px,-12px) rotate(180deg); }
          100% { transform: translate(0,0) rotate(360deg); }
        }
        @keyframes pulseFade {
          0%,100% { opacity:.10; }
          50%     { opacity:.22; }
        }
        .jd-shape { position:absolute; pointer-events:none; }

        /* ── Hero banner ── */
        .jd-hero {
          background: #1E1D4C;
          border-radius: 16px;
          padding: 20px 28px;
          margin-bottom: 16px;
          animation: fadeUp .5s ease both;
          position: relative;
          overflow: hidden;
        }
        .jd-hero::before {
          content: '';
          position: absolute; top: -60px; right: -60px;
          width: 260px; height: 260px; border-radius: 50%;
          background: rgba(255,255,255,.03);
          pointer-events: none;
        }
        .jd-hero::after {
          content: '';
          position: absolute; bottom: -80px; right: 120px;
          width: 200px; height: 200px; border-radius: 50%;
          background: rgba(255,255,255,.03);
          pointer-events: none;
        }
        .jd-hero-greeting {
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,.55);
          margin-bottom: 4px;
          text-transform: uppercase; letter-spacing: .07em;
        }
        .jd-hero-title {
          font-family: 'Poppins', sans-serif;
          font-size: 22px; font-weight: 800;
          color: #fff; margin: 0 0 16px;
          letter-spacing: -.4px; line-height: 1.2;
        }

        .jd-hero-stats {
          display: flex; gap: 1px;
          background: rgba(255,255,255,.08);
          border-radius: 12px; overflow: hidden;
        }
        .jd-hero-stat {
          flex: 1; padding: 16px 20px;
          background: rgba(255,255,255,.05);
          transition: background .2s;
        }
        .jd-hero-stat:hover { background: rgba(255,255,255,.09); }
        .jd-hero-stat-num {
          font-family: 'Poppins', sans-serif;
          font-size: 28px; font-weight: 800;
          color: #fff; line-height: 1;
          margin-bottom: 4px;
        }
        .jd-hero-stat-num.accent { color: #22c55e; }
        .jd-hero-stat-label {
          font-size: 11px; font-weight: 500;
          color: rgba(255,255,255,.45);
          text-transform: uppercase; letter-spacing: .07em;
        }
        .jd-hero-stat-sub {
          font-size: 11px; color: rgba(255,255,255,.3);
          margin-top: 2px;
        }
        .jd-divider {
          width: 1px; background: rgba(255,255,255,.08); flex-shrink: 0;
        }

        /* ── Search bar ── */
        .jd-search-row {
          display: flex; align-items: center;
          gap: 12px; margin-bottom: 12px;
          animation: fadeUp .45s ease both; animation-delay: .08s;
        }
        .jd-search-wrap {
          display: flex; align-items: center; gap: 10px;
          background: #fff; border: 1px solid #E4E7EC;
          border-radius: 10px; padding: 11px 16px;
          flex: 1; transition: border-color .2s, box-shadow .2s;
        }
        .jd-search-wrap.focused {
          border-color: #1E1D4C;
          box-shadow: 0 0 0 3px rgba(30,29,76,.08);
        }
        .jd-search-icon { font-size: 15px; color: #9CA3AF; transition: color .2s; }
        .jd-search-wrap.focused .jd-search-icon { color: #1E1D4C; }
        .jd-search-input {
          border: none; background: none; outline: none;
          font-family: 'Inter', sans-serif; font-size: 14px;
          color: #1E1D4C; width: 100%;
        }
        .jd-search-input::placeholder { color: #9CA3AF; }
        .jd-clear-btn {
          background: #F3F4F6; border: none; border-radius: 50%;
          width: 20px; height: 20px; cursor: pointer; font-size: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #6B7280; flex-shrink: 0;
          transition: background .15s;
          animation: popIn .2s ease both;
        }
        .jd-clear-btn:hover { background: #1E1D4C; color: #fff; }

        .jd-results-badge {
          font-size: 12px; font-weight: 500; color: #6B7280;
          background: #fff; border: 1px solid #E4E7EC;
          border-radius: 8px; padding: 8px 14px; white-space: nowrap;
        }

        /* ── Section heading ── */
        .jd-section-head {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 12px 0 4px;
          animation: fadeIn .4s ease both; animation-delay: .1s;
        }
        .jd-section-title {
          font-family: 'Poppins', sans-serif;
          font-size: 20px; font-weight: 700; color: #1E1D4C;
        }
        .jd-section-count {
          font-size: 13px; font-weight: 500; color: #9CA3AF;
          background: #F3F4F6; padding: 5px 12px; border-radius: 20px;
        }

        /* ── Grid ── */
        .jd-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          grid-auto-rows: 1fr;
          gap: 14px; margin-bottom: 28px;
        }
        .jd-card-wrap {
          animation: fadeUp .4s ease both;
          display: flex; flex-direction: column;
        }
        .jd-card-wrap > * { flex: 1; display: flex; flex-direction: column; }

        /* ── Shimmer ── */
        .jd-shimmer {
          background: linear-gradient(90deg, #ececec 25%, #e0e0e0 50%, #ececec 75%);
          background-size: 600px 100%;
          animation: shimmer 1.4s infinite linear;
          border-radius: 8px;
        }

        /* ── Empty ── */
        .jd-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; padding: 80px 20px;
          grid-column: 1 / -1;
          animation: fadeUp .4s ease both;
        }
        .jd-empty-icon {
          width: 64px; height: 64px; border-radius: 16px;
          background: #F3F4F6; display: flex; align-items: center;
          justify-content: center; font-size: 26px; margin-bottom: 16px;
          color: #9CA3AF;
        }
        .jd-empty-title { font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 700; color: #1E1D4C; margin-bottom: 6px; }
        .jd-empty-sub { font-size: 13px; color: #9CA3AF; text-align: center; max-width: 240px; line-height: 1.6; }

        /* ── Pagination ── */
        .pg-wrap {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; padding-top: 20px;
          border-top: 1px solid #E4E7EC;
          animation: fadeIn .4s ease both;
        }
        .pg-btn {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 500; cursor: pointer;
          border: 1px solid #E4E7EC; background: #fff; color: #374151;
          font-family: 'Inter', sans-serif;
          transition: background .15s, color .15s, border-color .15s, transform .12s;
        }
        .pg-btn:hover:not(:disabled) { background: #F3F4F6; transform: scale(1.08); }
        .pg-btn.active { background: #1E1D4C; color: #fff; border-color: #1E1D4C; }
        .pg-btn:disabled { opacity: .3; cursor: not-allowed; }
        .pg-arrow {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; cursor: pointer;
          border: 1px solid #E4E7EC; background: #fff; color: #374151;
          font-family: 'Inter', sans-serif;
          transition: background .15s, color .15s, border-color .15s, transform .12s;
        }
        .pg-arrow:hover:not(:disabled) { background: #1E1D4C; color: #fff; border-color: #1E1D4C; transform: scale(1.08); }
        .pg-arrow:disabled { opacity: .3; cursor: not-allowed; }
      `}</style>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── Static top section (hero + search + heading) ── */}
        <div style={{ padding: '20px 36px 0', flexShrink: 0 }}>

        {/* ── Hero ── */}
        <div className="jd-hero">
          {/* Animated background shapes */}
          <div className="jd-shape" style={{
            width:220, height:220, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(34,197,94,.18) 0%, transparent 70%)',
            top:-60, right:-40,
            animation:'floatA 9s ease-in-out infinite',
          }}/>
          <div className="jd-shape" style={{
            width:140, height:140, borderRadius:'30% 70% 70% 30% / 30% 30% 70% 70%',
            background:'rgba(255,255,255,.06)',
            top:10, right:200,
            animation:'floatB 7s ease-in-out infinite',
          }}/>
          <div className="jd-shape" style={{
            width:100, height:100, borderRadius:'50%',
            background:'rgba(34,197,94,.10)',
            bottom:-30, right:80,
            animation:'floatC 11s ease-in-out infinite',
          }}/>
          <div className="jd-shape" style={{
            width:60, height:60,
            borderRadius:'20%',
            background:'rgba(255,255,255,.05)',
            bottom:20, right:320,
            animation:'floatD 8s linear infinite',
          }}/>
          <div className="jd-shape" style={{
            width:180, height:180, borderRadius:'50%',
            background:'rgba(99,102,241,.12)',
            top:-70, left:'40%',
            animation:'floatA 13s ease-in-out infinite reverse',
          }}/>
          <div className="jd-shape" style={{
            width:80, height:80,
            borderRadius:'50%',
            background:'rgba(255,255,255,.04)',
            bottom:10, left:60,
            animation:'floatC 6s ease-in-out infinite',
          }}/>
          <div className="jd-shape" style={{
            width:50, height:50,
            borderRadius:'12px',
            background:'rgba(34,197,94,.08)',
            top:30, left:200,
            animation:'floatB 10s ease-in-out infinite reverse',
          }}/>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
            <h1 className="jd-hero-title" style={{ margin: 0 }}>
              Browse Jobs & Launch Interviews
            </h1>
            <div style={{
              background: 'rgba(255,255,255,.10)',
              borderRadius: 12, padding: '10px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              backdropFilter: 'blur(6px)',
              flexShrink: 0, marginLeft: 24,
            }}>
              <span style={{
                fontFamily: "'Poppins', sans-serif", fontSize: 28, fontWeight: 800,
                color: '#22c55e', lineHeight: 1,
              }}>{loading ? '—' : totalCount}</span>
              <span style={{
                fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.5)',
                textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 3,
              }}>Total Jobs</span>
            </div>
          </div>
        </div>

        {/* ── Search ── */}
        <div className="jd-search-row">
          <div className={`jd-search-wrap${searchFocused ? ' focused' : ''}`}>
            <span className="jd-search-icon">&#9906;</span>
            <input
              className="jd-search-input"
              type="text"
              placeholder="Search by title or company…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {query && (
              <button className="jd-clear-btn" onMouseDown={() => setQuery('')}>✕</button>
            )}
          </div>
          {!loading && (
            <div className="jd-results-badge">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* ── Section heading ── */}
        {(!loading && totalPages > 1) && (
          <div className="jd-section-head">
            <div className="jd-section-count">
              Page {page} of {totalPages}
            </div>
          </div>
        )}
        {query && (
          <div className="jd-section-head">
            <div className="jd-section-title">{`Results for "${query}"`}</div>
          </div>
        )}

        </div>{/* end static top section */}

        {/* ── Scrollable jobs area ── */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 36px 80px' }}>

        {/* ── Grid ── */}
        <div className="jd-grid">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 12,
                  border: '1px solid #E4E7EC', padding: 20,
                }}>
                  <div className="jd-shimmer" style={{ height: 16, width: '65%', marginBottom: 10 }} />
                  <div className="jd-shimmer" style={{ height: 12, width: '40%', marginBottom: 20 }} />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <div className="jd-shimmer" style={{ height: 22, width: 68, borderRadius: 20 }} />
                    <div className="jd-shimmer" style={{ height: 22, width: 84, borderRadius: 20 }} />
                  </div>
                  <div className="jd-shimmer" style={{ height: 34, width: 96, borderRadius: 8, marginLeft: 'auto' }} />
                </div>
              ))
            : paginated.map((job, i) => (
                <div
                  key={String(job.id)}
                  className="jd-card-wrap"
                  style={{ animationDelay: `${i * .05}s` }}
                >
                  <JobCard job={job} onClick={onSelectJob} />
                </div>
              ))
          }
          {!loading && filtered.length === 0 && (
            <div className="jd-empty">
              <div className="jd-empty-icon" style={{ fontSize: 20, color: '#9CA3AF' }}>?</div>
              <div className="jd-empty-title">No jobs found</div>
              <div className="jd-empty-sub">
                {query
                  ? `No results for "${query}". Try a different search term.`
                  : 'No jobs available right now.'}
              </div>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="pg-wrap">
            <button className="pg-arrow" disabled={page === 1} onClick={() => goToPage(page - 1)}>←</button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | 'dots')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('dots');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === 'dots' ? null : (
                  <button
                    key={p}
                    className={`pg-btn${page === p ? ' active' : ''}`}
                    onClick={() => goToPage(p as number)}
                  >{p}</button>
                )
              )
            }

            <button className="pg-arrow" disabled={page === totalPages} onClick={() => goToPage(page + 1)}>→</button>
          </div>
        )}
        </div>{/* end scrollable jobs area */}
      </main>
    </div>
  );
};
