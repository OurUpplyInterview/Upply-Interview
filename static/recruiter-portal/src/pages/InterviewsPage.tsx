import React, { useState, useEffect, useCallback } from 'react';

interface Props {
  user: { name?: string; email?: string } | null;
}

// ── Raw session from /recruiter/sessions ──────────────────────────────────────
interface Session {
  id: string;
  token: string;
  job_id: string;
  application_id: string;
  job_title: string;
  company: string;
  status: string; // PENDING | IN_PROGRESS | COMPLETED
  candidate_email: string;
  candidate_name: string;
  created_at: string;
  expires_at: string;
  num_questions: number;
}

// ── Per-question result ───────────────────────────────────────────────────────
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

// ── Animated background shapes ────────────────────────────────────────────────
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
        @keyframes floatC {
          0%   { transform: translate(0px,0px) rotate(45deg); }
          40%  { transform: translate(25px,35px) rotate(105deg); }
          80%  { transform: translate(-15px,-20px) rotate(165deg); }
          100% { transform: translate(0px,0px) rotate(225deg); }
        }
        @keyframes floatD {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); }
          25%  { transform: translate(20px,-30px) rotate(45deg) scale(0.95); }
          75%  { transform: translate(-25px,15px) rotate(-45deg) scale(1.05); }
          100% { transform: translate(0,0) rotate(0deg) scale(1); }
        }
        @keyframes floatE {
          0%   { transform: translate(0,0) rotate(0deg); }
          60%  { transform: translate(40px,20px) rotate(-120deg); }
          100% { transform: translate(0,0) rotate(-240deg); }
        }
      `}</style>
      <div style={{ position:'absolute', top:-80, left:-80, width:340, height:340, borderRadius:'50%', border:'2px solid rgba(0,200,150,0.12)', animation:'floatA 18s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:-20, left:-20, width:200, height:200, borderRadius:'50%', border:'1.5px solid rgba(0,200,150,0.08)', animation:'floatA 18s ease-in-out infinite reverse' }} />
      <div style={{ position:'absolute', top:60, right:100, width:120, height:120, border:'2px solid rgba(99,102,241,0.12)', borderRadius:16, animation:'floatB 14s ease-in-out infinite' }} />
      <div style={{ position:'absolute', top:100, right:135, width:60, height:60, border:'1.5px solid rgba(99,102,241,0.08)', borderRadius:8, animation:'floatB 14s ease-in-out infinite 2s' }} />
      <div style={{ position:'absolute', top:'38%', right:70, width:80, height:80, border:'2px solid rgba(0,200,150,0.10)', transform:'rotate(45deg)', borderRadius:6, animation:'floatC 20s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:'22%', left:80, width:90, height:90, border:'2px solid rgba(99,102,241,0.10)', borderRadius:8, transform:'rotate(45deg)', animation:'floatD 16s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:-120, right:-80, width:400, height:400, borderRadius:'50%', border:'2px solid rgba(0,200,150,0.07)', animation:'floatE 22s ease-in-out infinite' }} />
      <div style={{ position:'absolute', bottom:-60, right:-30, width:240, height:240, borderRadius:'50%', border:'1.5px solid rgba(0,200,150,0.05)', animation:'floatE 22s ease-in-out infinite 4s reverse' }} />
      <div style={{ position:'absolute', top:'55%', left:30, width:80, height:80, borderRadius:'50%', border:'1.5px solid rgba(148,163,184,0.12)', animation:'floatA 12s ease-in-out infinite 1s' }} />
      {[0,1,2].map(i => (
        <div key={i} style={{ position:'absolute', top:40, left:`${38+i*8}%`, width:7, height:7, borderRadius:'50%', background:`rgba(0,200,150,${0.09-i*0.02})`, animation:`floatD ${10+i*2}s ease-in-out infinite ${i*1.5}s` }} />
      ))}
      <div style={{ position:'absolute', bottom:100, left:'48%', width:50, height:50, border:'1.5px solid rgba(0,200,150,0.10)', borderRadius:6, animation:'floatB 17s ease-in-out infinite 5s', transform:'rotate(30deg)' }} />
    </div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────
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

// ── Status badge ──────────────────────────────────────────────────────────────
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

// ── Results modal ─────────────────────────────────────────────────────────────
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
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(10,14,35,0.65)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:720, maxHeight:'88vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(10,14,35,0.25)', animation:'modalIn 0.25s cubic-bezier(.4,0,.2,1)' }}>
        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#0f172a,#1e293b)', padding:'28px 32px', borderRadius:'20px 20px 0 0', display:'flex', alignItems:'center', gap:20, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', right:-40, top:-40, width:160, height:160, borderRadius:'50%', border:'2px solid rgba(0,200,150,0.12)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', right:60, bottom:-30, width:80, height:80, border:'1.5px solid rgba(0,200,150,0.08)', borderRadius:10, transform:'rotate(30deg)', pointerEvents:'none' }} />
          <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#00c896,#00a578)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ color:'#fff', fontWeight:700, fontSize:18 }}>{name}</div>
            <div style={{ color:'#94a3b8', fontSize:13, marginTop:2 }}>{session.job_title} {session.company ? `· ${session.company}` : ''}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:'#94a3b8', fontSize:11, marginBottom:4, letterSpacing:0.5 }}>OVERALL SCORE</div>
            <ScoreRing score={summary.avg_score} size={64} />
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:36, height:36, cursor:'pointer', color:'#fff', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
        </div>

        {/* Summary strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:'1px solid #f1f5f9' }}>
          {[
            { label:'Questions',      value: summary.total },
            { label:'Strong Answers', value: summary.strong },
            { label:'Best Score',     value: summary.best.toFixed(1) },
            { label:'Worst Score',    value: summary.worst.toFixed(1) },
          ].map(({ label, value }, idx) => (
            <div key={label} style={{ padding:'16px 24px', textAlign:'center', borderRight: idx < 3 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>{value}</div>
              <div style={{ fontSize:11, color:'#94a3b8', marginTop:2, fontWeight:500 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Questions */}
        <div style={{ overflow:'auto', padding:'20px 28px', flex:1 }}>
          {results.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0', color:'#94a3b8', fontSize:14 }}>
              No results recorded yet.
            </div>
          ) : results.map((item, i) => {
            const scoreColor = item.score >= 7 ? '#15803d' : item.score >= 5 ? '#a16207' : '#b91c1c';
            const scoreBg    = item.score >= 7 ? '#f0fdf4' : item.score >= 5 ? '#fefce8' : '#fef2f2';
            return (
              <div key={i} style={{ border:'1px solid #e8edf3', borderRadius:14, marginBottom:14, overflow:'hidden' }}>
                <div style={{ background:'#f8fafc', padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:12, borderBottom:'1px solid #e8edf3' }}>
                  <span style={{ background:'#1e293b', color:'#fff', borderRadius:8, width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>Q{i+1}</span>
                  <p style={{ margin:0, fontSize:14, color:'#1e293b', fontWeight:500, lineHeight:1.5 }}>{item.question}</p>
                  <div style={{ marginLeft:'auto', flexShrink:0, background:scoreBg, color:scoreColor, padding:'3px 10px', borderRadius:20, fontSize:13, fontWeight:700 }}>{item.score}/10</div>
                </div>
                <div style={{ padding:'14px 18px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <div style={{ fontSize:10, color:'#94a3b8', fontWeight:700, letterSpacing:0.5, marginBottom:6 }}>FEEDBACK</div>
                    <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.6 }}>{item.feedback}</p>
                  </div>
                  <div style={{ borderLeft:'2px solid #f1f5f9', paddingLeft:14 }}>
                    <div style={{ fontSize:10, color:'#00c896', fontWeight:700, letterSpacing:0.5, marginBottom:6 }}>TIP</div>
                    <p style={{ margin:0, fontSize:13, color:'#374151', lineHeight:1.6 }}>{item.tip}</p>
                  </div>
                </div>
                {item.transcript && (
                  <div style={{ padding:'0 18px 14px', borderTop:'1px solid #f8fafc' }}>
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

// ── Main page ─────────────────────────────────────────────────────────────────
export function InterviewsPage({ user }: Props) {
  const [sessions,    setSessions]    = useState<Session[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [filter,      setFilter]      = useState<'all'|'completed'|'in_progress'|'pending'>('all');
  const [search,      setSearch]      = useState('');
  const [modal,       setModal]       = useState<{ session: Session; data: SessionResults } | null>(null);
  const [loadingToken,setLoadingToken]= useState<string | null>(null);

  // ── Fetch all sessions directly from SQLite via backend ───────────────────
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/recruiter/sessions');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { ok: boolean; sessions: Session[] };
      setSessions(data.sessions || []);
    } catch (e) {
      setError('Could not load sessions. Is the backend running on port 8081?');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ── Open results modal ────────────────────────────────────────────────────
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

  // ── Filter + search ───────────────────────────────────────────────────────
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
    <div style={{ height:'100vh', overflow:'hidden', background:'#f4f4f8', padding:'40px 24px 24px', fontFamily:'Inter,sans-serif', position:'relative', display:'flex', flexDirection:'column' }}>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .iv-row { transition:background 0.15s,transform 0.15s,box-shadow 0.15s; }
        .iv-row:hover { background:#f8faff !important; transform:translateY(-1px); box-shadow:0 4px 20px rgba(0,0,0,0.07) !important; }
        .filter-btn { transition:all 0.15s; cursor:pointer; }
        .view-btn { transition:all 0.15s; }
        .view-btn:hover { background:#00b386 !important; transform:translateY(-1px); }
        .refresh-btn { transition:all 0.15s; }
        .refresh-btn:hover { border-color:#00c896 !important; color:#00c896 !important; }
      `}</style>

      <BackgroundShapes />

      <div style={{ maxWidth:1100, width:'100%', margin:'0 auto', position:'relative', zIndex:1, flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ marginBottom:32, animation:'fadeUp 0.4s ease' }}>
          <h1 style={{ fontSize:28, fontWeight:800, color:'#0f172a', margin:'0 0 6px' }}>Interviews</h1>
          <p style={{ fontSize:14, color:'#64748b', margin:0 }}>All invited candidates, active sessions &amp; AI-scored results</p>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28, animation:'fadeUp 0.4s ease 0.05s both' }}>
          {([
            { label:'Total Sessions',  value: counts.all,         color:'#6366f1', shape:'circle'  },
            { label:'Completed',       value: counts.completed,   color:'#00c896', shape:'check'   },
            { label:'In Progress',     value: counts.in_progress, color:'#3b82f6', shape:'diamond' },
            { label:'Pending',         value: counts.pending,     color:'#f59e0b', shape:'square'  },
          ] as const).map(({ label, value, color, shape }) => (
            <div key={label} style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:14, borderTop:`3px solid ${color}` }}>
              <div style={{ width:44, height:44, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="36" height="36" viewBox="0 0 36 36">
                  {shape==='circle'  && <><circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="2.5" opacity="0.7"/><circle cx="18" cy="18" r="7" fill={color} opacity="0.2"/></>}
                  {shape==='check'   && <><circle cx="18" cy="18" r="14" fill={color} opacity="0.12"/><polyline points="10,18 15,24 26,12" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></>}
                  {shape==='diamond' && <><polygon points="18,4 32,18 18,32 4,18" fill="none" stroke={color} strokeWidth="2.5" opacity="0.7"/><polygon points="18,10 26,18 18,26 10,18" fill={color} opacity="0.18"/></>}
                  {shape==='square'  && <><rect x="5" y="5" width="26" height="26" rx="5" fill="none" stroke={color} strokeWidth="2.5" opacity="0.7"/><rect x="11" y="11" width="14" height="14" rx="3" fill={color} opacity="0.2"/></>}
                </svg>
              </div>
              <div>
                <div style={{ fontSize:26, fontWeight:800, color:'#0f172a', lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:12, color:'#94a3b8', fontWeight:500, marginTop:4 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div style={{ background:'#fff', borderRadius:16, padding:'14px 18px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', marginBottom:20, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', animation:'fadeUp 0.4s ease 0.1s both' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }} width="15" height="15" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="#94a3b8" strokeWidth="2"/>
              <path d="M14 14l3 3" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidate, email or job..."
              style={{ width:'100%', padding:'9px 12px 9px 36px', border:'1.5px solid #e8edf3', borderRadius:10, fontSize:14, outline:'none', color:'#1e293b', background:'#f8fafc', fontFamily:'Inter,sans-serif', transition:'border-color 0.15s' }}
              onFocus={e=>(e.target.style.borderColor='#00c896')}
              onBlur={e =>(e.target.style.borderColor='#e8edf3')}
            />
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {([
              { key:'all',         label:'All',         count: counts.all },
              { key:'completed',   label:'Completed',   count: counts.completed },
              { key:'in_progress', label:'In Progress', count: counts.in_progress },
              { key:'pending',     label:'Pending',     count: counts.pending },
            ] as const).map(f => (
              <button key={f.key} className="filter-btn" onClick={() => setFilter(f.key)}
                style={{ padding:'7px 14px', borderRadius:20, border:'none', fontSize:13, fontWeight:600, background: filter===f.key ? '#0f172a' : '#f1f5f9', color: filter===f.key ? '#fff' : '#64748b' }}>
                {f.label}
                <span style={{ marginLeft:5, background: filter===f.key ? 'rgba(255,255,255,0.18)' : '#e2e8f0', color: filter===f.key ? '#fff' : '#94a3b8', padding:'1px 7px', borderRadius:10, fontSize:11 }}>{f.count}</span>
              </button>
            ))}
          </div>
          <button onClick={loadSessions} className="refresh-btn" style={{ background:'none', border:'1.5px solid #e8edf3', borderRadius:10, padding:'8px 14px', cursor:'pointer', fontSize:13, color:'#64748b', display:'flex', alignItems:'center', gap:6 }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M4 10a6 6 0 1 1 1.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <polyline points="1,7 4,10 7,7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'14px 20px', marginBottom:20, color:'#b91c1c', fontSize:14 }}>
            {error}
          </div>
        )}

        {/* Table */}
        <div style={{ background:'#fff', borderRadius:18, boxShadow:'0 2px 16px rgba(0,0,0,0.07)', overflow:'hidden', animation:'fadeUp 0.4s ease 0.15s both', flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
          {/* Table header */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 120px', padding:'14px 24px', background:'#f8fafc', borderBottom:'1px solid #e8edf3' }}>
            {['Candidate','Job','Status','Score',''].map(h => (
              <div key={h} style={{ fontSize:11, color:'#94a3b8', fontWeight:700, letterSpacing:0.6 }}>{h.toUpperCase()}</div>
            ))}
          </div>

          {/* Scrollable rows area */}
          <div style={{ flex:1, overflowY:'auto', minHeight:0 }}>
          {/* Loading */}
          {loading ? (
            <div style={{ padding:'70px 24px', textAlign:'center' }}>
              <svg width="40" height="40" viewBox="0 0 40 40" style={{ marginBottom:16, opacity:0.25 }}>
                <circle cx="20" cy="20" r="16" fill="none" stroke="#0f172a" strokeWidth="3" strokeDasharray="50 50" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 20 20" to="360 20 20" dur="1s" repeatCount="indefinite"/>
                </circle>
              </svg>
              <div style={{ fontSize:15, fontWeight:500, color:'#94a3b8' }}>Loading sessions…</div>
            </div>

          /* Empty */
          ) : filtered.length === 0 ? (
            <div style={{ padding:'70px 24px', textAlign:'center' }}>
              <svg width="56" height="56" viewBox="0 0 56 56" style={{ marginBottom:16, opacity:0.18 }}>
                <rect x="8" y="8" width="40" height="40" rx="8" fill="none" stroke="#0f172a" strokeWidth="3"/>
                <line x1="18" y1="22" x2="38" y2="22" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="18" y1="30" x2="32" y2="30" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round"/>
                <line x1="18" y1="38" x2="28" y2="38" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <div style={{ fontSize:15, fontWeight:600, color:'#64748b' }}>
                {sessions.length === 0 ? 'No interview sessions yet' : 'No matches found'}
              </div>
              <div style={{ fontSize:13, marginTop:6, color:'#94a3b8' }}>
                {sessions.length === 0
                  ? 'Go to Jobs → select a job → invite candidates to create sessions.'
                  : 'Try adjusting your search or filter.'}
              </div>
            </div>

          /* Rows */
          ) : filtered.map((session, i) => {
            const name        = session.candidate_name  || 'Candidate';
            const email       = session.candidate_email || '';
            const status      = (session.status || '').toUpperCase();
            const isCompleted = status === 'COMPLETED';
            const isLoading   = loadingToken === session.token;

            return (
              <div key={session.id || session.token}
                className="iv-row"
                style={{ display:'grid', gridTemplateColumns:'2fr 2fr 1fr 1fr 120px', padding:'16px 24px', borderBottom:'1px solid #f1f5f9', alignItems:'center', cursor: isCompleted ? 'pointer' : 'default', background:'#fff' }}
                onClick={() => isCompleted && !isLoading && openResults(session)}
              >
                {/* Candidate */}
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#1e293b,#334155)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14, color:'#1e293b' }}>{name}</div>
                    <div style={{ fontSize:12, color:'#94a3b8', marginTop:1 }}>{email}</div>
                  </div>
                </div>

                {/* Job */}
                <div>
                  <div style={{ fontWeight:500, fontSize:14, color:'#334155' }}>{session.job_title || '—'}</div>
                  <div style={{ fontSize:12, color:'#94a3b8', marginTop:1 }}>{session.company || ''}</div>
                </div>

                {/* Status */}
                <div><StatusBadge status={session.status} /></div>

                {/* Score — only show for completed */}
                <div>
                  {isCompleted
                    ? <span style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>Click to view</span>
                    : <span style={{ fontSize:13, color:'#cbd5e1' }}>—</span>
                  }
                </div>

                {/* Action */}
                <div>
                  {isCompleted ? (
                    <button className="view-btn"
                      onClick={e => { e.stopPropagation(); openResults(session); }}
                      style={{ background:'#00c896', color:'#fff', border:'none', borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', minWidth:100 }}
                    >
                      {isLoading ? '…' : 'View Report'}
                    </button>
                  ) : (
                    <span style={{ fontSize:12, color:'#cbd5e1', fontStyle:'italic' }}>
                      {status === 'IN_PROGRESS' ? 'In session' : 'Awaiting'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          </div>{/* end scrollable rows */}

          {/* Footer count — sticky inside the white card, outside scroll */}
          {!loading && filtered.length > 0 && (
            <div style={{ padding:'10px 24px', borderTop:'1px solid #f1f5f9', textAlign:'center', fontSize:12, color:'#94a3b8', background:'#fff', flexShrink:0 }}>
              Showing {filtered.length} of {sessions.length} sessions
              {counts.completed > 0 && ' · Click a completed row to view the AI report'}
            </div>
          )}
        </div>

      </div>{/* end inner maxWidth div */}

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
