import React, { useState, useEffect, useCallback } from 'react';

interface Props {
  user: { name?: string; email?: string } | null;
}

interface Session {
  id: string;
  token: string;
  job_id: string;
  application_id: string;
  job_title: string;
  company: string;
  status: string;
  candidate_email: string;
  candidate_name: string;
  created_at: string;
  expires_at: string;
  num_questions: number;
}

interface ResultItem {
  question: string;
  score: number;
  feedback: string;
  tip: string;
  transcript?: string;
}

interface ResultSummary {
  avg_score: number;
  best: number;
  worst: number;
  strong: number;
  total: number;
}

interface SessionResults {
  ok: boolean;
  session: Session;
  results: ResultItem[];
  summary: ResultSummary;
}

function BackgroundShapes() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <style>{`
        @keyframes floatA {
          0%   { transform: translate(0px,0px) rotate(0deg); }
          33%  { transform: translate(30px,-40px) rotate(60deg); }
          66%  { transform: translate(-20px,20px) rotate(120deg); }
          100% { transform: translate(0px,0px) rotate(180deg); }
        }
        @keyframes floatB {
          0%   { transform: translate(0px,0px) rotate(0deg) scale(1); }
          50%  { transform: translate(-35px,30px) rotate(-90deg) scale(1.1); }
          100% { transform: translate(0px,0px) rotate(-180deg) scale(1); }
        }
        @keyframes floatE {
          0%   { transform: translate(0,0) rotate(0deg); }
          60%  { transform: translate(40px,20px) rotate(-120deg); }
          100% { transform: translate(0,0) rotate(-240deg); }
        }
      `}</style>
      <div style={{ position:'absolute', top:-80, left:-80, width:340, height:340, borderRadius:'50%', border:'2px solid rgba(0,200,150,0.12)', animation:'floatA 18s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:-120, right:-80, width:400, height:400, borderRadius:'50%', border:'2px solid rgba(0,200,150,0.07)', animation:'floatE 22s ease-in-out infinite' }} />
    </div>
  );
}

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score / 10, 0), 1);
  const color = score >= 7 ? '#00c896' : score >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8eaf0" strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
        style={{ transition:'stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)' }} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size*0.22} fontWeight="700"
        style={{ transform:`rotate(90deg)`, transformOrigin:`${size/2}px ${size/2}px`, fontFamily:'Inter,sans-serif' }}>
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status || '').toUpperCase();
  const map: Record<string, { bg: string; color: string; label: string }> = {
    COMPLETED:   { bg:'#dcfce7', color:'#15803d', label:'Completed' },
    IN_PROGRESS: { bg:'#fef9c3', color:'#a16207', label:'In Progress' },
    PENDING:     { bg:'#f3f4f6', color:'#6b7280', label:'Pending' },
  };
  const cfg = map[s] || map.PENDING;
  return (
    <span style={{ background:cfg.bg, color:cfg.color, fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, letterSpacing:0.3, whiteSpace:'nowrap' }}>
      {cfg.label}
    </span>
  );
}

function ResultsModal({ session, results, summary, onClose }: {
  session: Session; results: ResultItem[]; summary: ResultSummary; onClose: () => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  const name = session.candidate_name || 'Candidate';

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(10,14,35,0.65)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:720, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(10,14,35,0.25)', animation:'modalIn 0.25s cubic-bezier(.4,0,.2,1)' }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', padding:'20px 20px', borderRadius:'20px 20px 0 0', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#00c896,#00a578)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:'#fff', fontWeight:700, fontSize:16 }}>{name}</div>
            <div style={{ color:'#94a3b8', fontSize:12, marginTop:2 }}>{session.job_title} {session.company ? `· ${session.company}` : ''}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'#94a3b8', fontSize:10, marginBottom:4, letterSpacing:0.5 }}>OVERALL SCORE</div>
              <ScoreRing score={summary.avg_score} size={56} />
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:32, height:32, cursor:'pointer', color:'#fff', fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
          </div>
        </div>

        {/* Summary strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:'1px solid #f1f5f9' }}>
          {[
            { label:'Questions',      value: summary.total },
            { label:'Strong',         value: summary.strong },
            { label:'Best',           value: summary.best.toFixed(1) },
            { label:'Worst',          value: summary.worst.toFixed(1) },
          ].map(({ label, value }, idx) => (
            <div key={label} style={{ padding:'12px 8px', textAlign:'center', borderRight: idx < 3 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ fontSize:20, fontWeight:800, color:'#0f172a' }}>{value}</div>
              <div style={{ fontSize:10, color:'#94a3b8', marginTop:2, fontWeight:500 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Questions */}
        <div style={{ overflow:'auto', padding:'16px 16px', flex:1 }}>
          {results.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#94a3b8', fontSize:14 }}>
              No results recorded yet.
            </div>
          ) : results.map((item, i) => {
            const scoreColor = item.score >= 7 ? '#15803d' : item.score >= 5 ? '#a16207' : '#b91c1c';
            const scoreBg    = item.score >= 7 ? '#f0fdf4' : item.score >= 5 ? '#fefce8' : '#fef2f2';
            return (
              <div key={i} style={{ border:'1px solid #e8edf3', borderRadius:14, marginBottom:14, overflow:'hidden' }}>
                <div style={{ background:'#f8fafc', padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:10, borderBottom:'1px solid #e8edf3' }}>
                  <span style={{ background:'#1e293b', color:'#fff', borderRadius:8, width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>Q{i+1}</span>
                  <p style={{ margin:0, fontSize:13, color:'#1e293b', fontWeight:500, lineHeight:1.5, flex:1 }}>{item.question}</p>
                  <div style={{ flexShrink:0, background:scoreBg, color:scoreColor, padding:'3px 8px', borderRadius:20, fontSize:12, fontWeight:700 }}>{item.score}/10</div>
                </div>
                <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
                  <div>
                    <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, letterSpacing:0.5, marginBottom:4 }}>FEEDBACK</div>
                    <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.6 }}>{item.feedback}</p>
                  </div>
                  <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:10 }}>
                    <div style={{ fontSize:10, color:'#00c896', fontWeight:700, letterSpacing:0.5, marginBottom:4 }}>TIP</div>
                    <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.6 }}>{item.tip}</p>
                  </div>
                </div>
                {item.transcript && (
                  <div style={{ padding:'0 14px 12px' }}>
                    <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, letterSpacing:0.5, marginBottom:4 }}>TRANSCRIPT</div>
                    <p style={{ margin:0, fontSize:12, color:'#64748b', lineHeight:1.6, fontStyle:'italic' }}>"{item.transcript}"</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function InterviewsPage({ user }: Props) {
  const [sessions,    setSessions]    = useState<Session[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [filter,      setFilter]      = useState<'all'|'completed'|'in_progress'|'pending'>('all');
  const [search,      setSearch]      = useState('');
  const [modal,       setModal]       = useState<{ session: Session; data: SessionResults } | null>(null);
  const [loadingToken,setLoadingToken]= useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/recruiter/sessions');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { ok: boolean; sessions: Session[] };
      setSessions(data.sessions || []);
    } catch (e) {
      setError('Could not load sessions.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const openResults = useCallback(async (session: Session) => {
    setLoadingToken(session.token);
    try {
      const res  = await fetch(`/recruiter/session/${session.token}/results`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as SessionResults;
      setModal({ session, data });
    } catch (e) {
      console.error('Failed to load results:', e);
    } finally {
      setLoadingToken(null);
    }
  }, []);

  const filtered = sessions.filter(s => {
    const status = (s.status || '').toUpperCase();
    if (filter === 'completed'   && status !== 'COMPLETED')   return false;
    if (filter === 'in_progress' && status !== 'IN_PROGRESS') return false;
    if (filter === 'pending'     && status !== 'PENDING')     return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !(s.candidate_name  || '').toLowerCase().includes(q) &&
        !(s.candidate_email || '').toLowerCase().includes(q) &&
        !(s.job_title       || '').toLowerCase().includes(q) &&
        !(s.company         || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const counts = {
    all:         sessions.length,
    completed:   sessions.filter(s => s.status?.toUpperCase() === 'COMPLETED').length,
    in_progress: sessions.filter(s => s.status?.toUpperCase() === 'IN_PROGRESS').length,
    pending:     sessions.filter(s => s.status?.toUpperCase() === 'PENDING').length,
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f4f4f8', padding:'24px 16px', fontFamily:'Inter,sans-serif', position:'relative' }}>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .iv-row { transition:background 0.15s; }
        .iv-row:hover { background:#f8faff !important; }
        .filter-btn { transition:all 0.15s; cursor:pointer; }
        .view-btn { transition:all 0.15s; }
        .view-btn:hover { background:#00b386 !important; }
        .refresh-btn { transition:all 0.15s; }
        .refresh-btn:hover { border-color:#00c896 !important; color:#00c896 !important; }

        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .filter-scroll { overflow-x: auto; flex-wrap: nowrap !important; padding-bottom: 4px; }
          .table-header { display: none !important; }
          .iv-row { display: block !important; padding: 14px 16px !important; }
          .iv-row-inner { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
          .iv-row-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        }
      `}</style>

      <BackgroundShapes />

      <div style={{ maxWidth:1100, width:'100%', margin:'0 auto', position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ marginBottom:24, animation:'fadeUp 0.4s ease' }}>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', margin:'0 0 4px' }}>Interviews</h1>
          <p style={{ fontSize:13, color:'#64748b', margin:0 }}>All invited candidates, active sessions &amp; AI-scored results</p>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20, animation:'fadeUp 0.4s ease 0.05s both' }}>
          {([
            { label:'Total Sessions',  value: counts.all,         color:'#6366f1' },
            { label:'Completed',       value: counts.completed,   color:'#00c896' },
            { label:'In Progress',     value: counts.in_progress, color:'#3b82f6' },
            { label:'Pending',         value: counts.pending,     color:'#f59e0b' },
          ]).map(({ label, value, color }) => (
            <div key={label} style={{ background:'#fff', borderRadius:14, padding:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', borderTop:`3px solid ${color}` }}>
              <div style={{ fontSize:24, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{value}</div>
              <div style={{ fontSize:12, color:'#94a3b8', fontWeight:500, marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div style={{ background:'#fff', borderRadius:14, padding:'12px 14px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:16, animation:'fadeUp 0.4s ease 0.1s both' }}>
          <div style={{ position:'relative', marginBottom:10 }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="#94a3b8" strokeWidth="2"/>
              <path d="M14 14l3 3" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidate, email or job..."
              style={{ width:'100%', padding:'9px 12px 9px 32px', border:'1.5px solid #e8edf3', borderRadius:10, fontSize:14, outline:'none', color:'#1e293b', background:'#f8fafc', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }}
              onFocus={e=>(e.target.style.borderColor='#00c896')}
              onBlur={e =>(e.target.style.borderColor='#e8edf3')}
            />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'space-between' }}>
            <div className="filter-scroll" style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {([
                { key:'all',         label:'All',         count: counts.all },
                { key:'completed',   label:'Completed',   count: counts.completed },
                { key:'in_progress', label:'In Progress', count: counts.in_progress },
                { key:'pending',     label:'Pending',     count: counts.pending },
              ] as const).map(f => (
                <button key={f.key} className="filter-btn" onClick={() => setFilter(f.key)}
                  style={{ padding:'6px 12px', borderRadius:20, border:'none', fontSize:12, fontWeight:600, background: filter===f.key ? '#0f172a' : '#f1f5f9', color: filter===f.key ? '#fff' : '#64748b', whiteSpace:'nowrap' }}>
                  {f.label}
                  <span style={{ marginLeft:4, background: filter===f.key ? 'rgba(255,255,255,0.18)' : '#e2e8f0', color: filter===f.key ? '#fff' : '#94a3b8', padding:'1px 6px', borderRadius:10, fontSize:10 }}>{f.count}</span>
                </button>
              ))}
            </div>
            <button onClick={loadSessions} className="refresh-btn" style={{ background:'none', border:'1.5px solid #e8edf3', borderRadius:10, padding:'7px 12px', cursor:'pointer', fontSize:12, color:'#64748b', display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                <path d="M4 10a6 6 0 1 1 1.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <polyline points="1,7 4,10 7,7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'12px 16px', marginBottom:16, color:'#b91c1c', fontSize:14 }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div style={{ background:'#fff', borderRadius:16, boxShadow:'0 2px 16px rgba(0,0,0,0.07)', overflow:'hidden', animation:'fadeUp 0.4s ease 0.15s both' }}>
          {/* Table header - hidden on mobile */}
          <div className="table-header" style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 120px', padding:'12px 20px', background:'#f8fafc', borderBottom:'1px solid #e8edf3' }}>
            {['Candidate','Job','Status','Score',''].map(h => (
              <div key={h} style={{ fontSize:11, color:'#94a3b8', fontWeight:700, letterSpacing:0.6 }}>{h.toUpperCase()}</div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding:'60px 20px', textAlign:'center' }}>
              <div style={{ fontSize:14, fontWeight:500, color:'#94a3b8' }}>Loading sessions…</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:'60px 20px', textAlign:'center' }}>
              <div style={{ fontSize:14, fontWeight:600, color:'#64748b' }}>
                {sessions.length === 0 ? 'No interview sessions yet' : 'No matches found'}
              </div>
              <div style={{ fontSize:13, marginTop:6, color:'#94a3b8' }}>
                {sessions.length === 0
                  ? 'Go to Jobs → select a job → invite candidates to create sessions.'
                  : 'Try adjusting your search or filter.'}
              </div>
            </div>
          ) : filtered.map((session) => {
            const name        = session.candidate_name  || 'Candidate';
            const email       = session.candidate_email || '';
            const status      = (session.status || '').toUpperCase();
            const isCompleted = status === 'COMPLETED';
            const isLoading   = loadingToken === session.token;

            return (
              <div key={session.id || session.token} className="iv-row"
                style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 120px', padding:'14px 20px', borderBottom:'1px solid #f1f5f9', alignItems:'center', cursor: isCompleted ? 'pointer' : 'default', background:'#fff' }}
                onClick={() => isCompleted && !isLoading && openResults(session)}
              >
                {/* Candidate */}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#1e293b,#334155)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:13, flexShrink:0 }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{email}</div>
                  </div>
                </div>

                {/* Job */}
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:500, fontSize:13, color:'#334155', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session.job_title || '—'}</div>
                  <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>{session.company || ''}</div>
                </div>

                {/* Status */}
                <div><StatusBadge status={session.status} /></div>

                {/* Score */}
                <div>
                  {isCompleted
                    ? <span style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>Click to view</span>
                    : <span style={{ fontSize:12, color:'#cbd5e1' }}>—</span>
                  }
                </div>

                {/* Action */}
                <div>
                  {isCompleted ? (
                    <button className="view-btn"
                      onClick={e => { e.stopPropagation(); openResults(session); }}
                      style={{ background:'#00c896', color:'#fff', border:'none', borderRadius:10, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', width:'100%' }}
                    >
                      {isLoading ? '…' : 'View Report'}
                    </button>
                  ) : (
                    <span style={{ fontSize:11, color:'#cbd5e1', fontStyle:'italic' }}>
                      {status === 'IN_PROGRESS' ? 'In session' : 'Awaiting'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Footer */}
          {!loading && filtered.length > 0 && (
            <div style={{ padding:'10px 20px', borderTop:'1px solid #f1f5f9', textAlign:'center', fontSize:12, color:'#94a3b8', background:'#fff' }}>
              Showing {filtered.length} of {sessions.length} sessions
            </div>
          )}
        </div>

      </div>

      {/* Results modal */}
      {modal && (
        <ResultsModal
          session={modal.session}
          results={modal.data.results}
          summary={modal.data.summary}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
