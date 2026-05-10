import React, { useEffect, useState } from 'react';
import type { Job, SendTarget, InterviewResults } from '../interfaces';
import { useApplicants } from '../hooks/useApplicants';
import { ApplicantTable } from '../components/ApplicantTable';
import { ConfirmModal, ResultsModal } from '../components/Modals';
import { interviewService } from '../services/api';

interface JobDetailPageProps {
  job: Job;
  onBack: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | '') => void;
}

export const JobDetailPage: React.FC<JobDetailPageProps> = ({
  job, onBack, showToast,
}) => {
  const { applicants, loading, selected, fetchApplicants, toggleSelect, toggleAll, sendInterviews } = useApplicants();
  const [numQ, setNumQ] = useState(5);
  const [jd, setJd] = useState('');

  const [confirm, setConfirm] = useState<{ open: boolean; title: string; body: string; onConfirm: () => void }>({
    open: false, title: '', body: '', onConfirm: () => {},
  });

  const [results, setResults] = useState<{ open: boolean; name: string; summary: InterviewResults['summary'] | null; items: InterviewResults['results'] }>({
    open: false, name: '', summary: null, items: [],
  });

  useEffect(() => { fetchApplicants(job.id); }, [job.id, fetchApplicants]);

  useEffect(() => {
    const fetchJd = async () => {
      try {
        const res = await fetch(`/proxy/jobs/${job.id}`);
        const data = await res.json();
        const desc =
          data.description || data.jobDescription || data.jd ||
          data.details || data.content || data.body ||
          job.description || job.jobDescription || (job as any).jd || '';
        setJd(desc);
      } catch (e) {
        console.error('JD fetch failed', e);
      }
    };
    fetchJd();
  }, [job.id]);

  const org = job.organizationName || job.companyName || (job as any).company || '';
  const loc = job.location || (job as any).city || (job as any).country || '';

  const doSend = async (targets: SendTarget[]) => {
    setConfirm(c => ({ ...c, open: false }));
    const descToUse = jd || job.title || '';
    if (!descToUse) { showToast('⚠️ No job description found.', 'error'); return; }
    showToast(`Sending ${targets.length} interview link${targets.length !== 1 ? 's' : ''}…`, 'info');
    try {
      const data = await sendInterviews(targets, job.id, job.title || '', org, descToUse, numQ);
      if (!data.ok) { showToast('Error: ' + (data.error || 'Unknown'), 'error'); return; }
      const sent = data.results.filter(r => r.email_sent).length;
      const fail = data.results.filter(r => !r.email_sent).length;
      showToast(
        fail === 0 ? `✅ ${sent} link${sent !== 1 ? 's' : ''} sent!` : `⚠️ ${sent} sent, ${fail} failed`,
        fail === 0 ? 'success' : 'error'
      );
    } catch (e) { showToast('Send failed: ' + (e as Error).message, 'error'); }
  };

  const confirmSendAll = () => {
    const targets = applicants.map(a => ({
      id:    a.id || a.applicationId || '',
      email: a.applicantEmail || a.candidateEmail || a.email || '',
      name:  a.applicantName  || a.candidateName  || a.name  || 'Candidate',
    }));
    setConfirm({
      open: true,
      title: `Send to all ${targets.length} applicants?`,
      body:  `This will email a unique AI interview link to all ${targets.length} applicant${targets.length !== 1 ? 's' : ''}.`,
      onConfirm: () => doSend(targets),
    });
  };

  const confirmSendSelected = () => {
    const targets = applicants
      .filter(a => selected.has(String(a.id || a.applicationId)))
      .map(a => ({
        id:    a.id || a.applicationId || '',
        email: a.applicantEmail || a.candidateEmail || a.email || '',
        name:  a.applicantName  || a.candidateName  || a.name  || 'Candidate',
      }));
    setConfirm({
      open: true,
      title: `Send to ${targets.length} selected?`,
      body:  `Sending AI interview links to ${targets.length} applicant${targets.length !== 1 ? 's' : ''}.`,
      onConfirm: () => doSend(targets),
    });
  };

  const sendOne = (appId: string, email: string, name: string) => {
    setConfirm({
      open: true,
      title: 'Send interview link?',
      body:  `Sending to ${name} (${email}).`,
      onConfirm: () => doSend([{ id: appId, email, name }]),
    });
  };

  const viewResults = async (appId: string) => {
    const data = await interviewService.getResults(job.id, appId);
    if (!data || !data.ok) { showToast('No results found yet.', 'error'); return; }
    setResults({ open: true, name: data.session.candidate_name || 'Candidate', summary: data.summary, items: data.results });
  };

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: '#F4F4FB', fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .detail-btn-primary {
          display: inline-flex; align-items: center; gap: 7px;
          border: none; border-radius: 30px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          padding: 10px 20px; cursor: pointer;
          background: #1E1D4C; color: #fff;
          transition: background .15s, transform .1s;
        }
        .detail-btn-primary:hover { background: #2D2B6B; }
        .detail-btn-primary:active { transform: scale(.97); }

        .detail-btn-mint {
          display: inline-flex; align-items: center; gap: 7px;
          border: none; border-radius: 30px;
          font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700;
          padding: 10px 20px; cursor: pointer;
          background: #22c55e; color: #fff;
          transition: background .15s, transform .1s, opacity .15s;
        }
        .detail-btn-mint:hover { background: #16a34a; }
        .detail-btn-mint:active { transform: scale(.97); }
        .detail-btn-mint:disabled { opacity: .4; cursor: not-allowed; }

        .back-btn {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 13px; font-weight: 600; color: #1E1D4C;
          cursor: pointer; background: transparent;
          border: 1.5px solid #E2E2EE; border-radius: 30px;
          padding: 7px 16px; font-family: 'Inter', sans-serif;
          margin-bottom: 20px;
          transition: background .2s, color .2s, border-color .2s;
        }
        .back-btn:hover { background: #1E1D4C; color: #fff; border-color: #1E1D4C; }
        .back-btn .arr { transition: transform .2s; }
        .back-btn:hover .arr { transform: translateX(-3px); }

        .num-input {
          width: 64px; padding: 8px 10px;
          background: #F4F4F8; border: 1.5px solid #E2E2EE;
          border-radius: 10px; color: #1E1C4A;
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
          text-align: center; outline: none;
          transition: border-color .15s;
        }
        .num-input:focus { border-color: #1E1D4C; }

        .toolbar-card {
          background: #fff; border: 0.5px solid #E2E2EE; border-radius: 16px;
          padding: 16px 22px; margin-bottom: 20px;
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          box-shadow: 0 2px 8px rgba(30,29,76,.04);
          animation: fadeUp .35s ease both;
        }

        .applicants-card {
          background: #fff; border: 0.5px solid #E2E2EE; border-radius: 16px;
          overflow: hidden; box-shadow: 0 2px 8px rgba(30,29,76,.04);
          animation: fadeUp .35s .08s ease both;
        }

        .job-hero {
          background: linear-gradient(135deg, #1E1D4C 0%, #2D2B6B 60%, #134a3a 100%);
          padding: 28px 32px 32px; border-radius: 16px; margin-bottom: 20px;
          position: relative; overflow: hidden;
          box-shadow: 0 4px 20px rgba(30,29,76,.12);
          animation: fadeUp .35s ease both;
        }
        .job-hero::before {
          content: ''; position: absolute; right: -40px; top: -40px;
          width: 200px; height: 200px; border-radius: 50%;
          background: rgba(62,207,160,.08); pointer-events: none;
        }
        .job-hero::after {
          content: ''; position: absolute; left: -20px; bottom: -30px;
          width: 120px; height: 120px; border-radius: 50%;
          background: rgba(62,207,160,.05); pointer-events: none;
        }
      `}</style>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: '28px 36px 0', overflowY: 'hidden', height: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Back button */}
        <button className="back-btn" onClick={onBack}>
          <span className="arr">←</span> All Jobs
        </button>

        {/* Job Hero Card */}
        <div className="job-hero">
          <div style={{
            fontFamily: "'Poppins', sans-serif", fontSize: 22,
            fontWeight: 800, color: '#fff', letterSpacing: '-.4px', marginBottom: 6,
          }}>
            {job.title}
          </div>
          <div style={{ width: 36, height: 3, background: 'linear-gradient(90deg,#3ECFA0,transparent)', borderRadius: 2, marginBottom: 10 }} />
          {(org || loc) && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', fontWeight: 500 }}>
              {[org, loc].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="toolbar-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#6B6A8E', fontWeight: 600, letterSpacing: '.01em' }}>
              Questions per interview
            </span>
            <input
              className="num-input"
              type="number" value={numQ} min={1} max={20}
              onChange={e => setNumQ(parseInt(e.target.value) || 5)}
            />
          </div>

          <div style={{ width: 1, height: 30, background: '#E2E2EE', flexShrink: 0 }} />

          <button className="detail-btn-primary" onClick={confirmSendAll}>
            📨 Send to all applicants
          </button>
          <button
            className="detail-btn-mint"
            onClick={confirmSendSelected}
            disabled={selected.size === 0}
            style={{ opacity: selected.size === 0 ? .4 : 1, cursor: selected.size === 0 ? 'not-allowed' : 'pointer' }}
          >
            Send to selected ({selected.size})
          </button>
        </div>

        {/* Kanban Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <h3 style={{
            fontFamily: "'Poppins', sans-serif", fontSize: 14,
            fontWeight: 700, color: '#1E1D4C', margin: 0,
          }}>
            Applicants{' '}
            <span style={{ color: '#9998B8', fontWeight: 400, fontSize: 13, fontFamily: "'Inter', sans-serif" }}>
              ({applicants.length})
            </span>
          </h3>
          {selected.size > 0 && (
            <span style={{
              fontSize: 12, color: '#0f6e56', background: '#E4F7F0',
              padding: '4px 12px', borderRadius: 20, fontWeight: 600,
            }}>
              {selected.size} selected
            </span>
          )}
        </div>

        {/* Kanban Board */}
        {(() => {
          const columns: { key: string; label: string; dot: string; headerBg: string; headerColor: string; accent: string }[] = [
            { key: 'pending',   label: 'Pending',   dot: '#534AB7', headerBg: '#EEEDFB', headerColor: '#1E1D4C', accent: '#534AB7' },
            { key: 'sent',      label: 'Sent',      dot: '#22c55e', headerBg: '#E4F7F0', headerColor: '#0f6e56', accent: '#22c55e' },
            { key: 'completed', label: 'Completed', dot: '#7C3AED', headerBg: '#EDE9FE', headerColor: '#5B21B6', accent: '#7C3AED' },
            { key: 'failed',    label: 'Failed',    dot: '#EF4444', headerBg: '#FEF2F2', headerColor: '#991B1B', accent: '#EF4444' },
          ];

          const avatarColors: Record<string, { bg: string; color: string }> = {
            a: { bg: '#EDE9FE', color: '#5B21B6' }, b: { bg: '#DBEAFE', color: '#1D4ED8' },
            c: { bg: '#D1FAE5', color: '#065F46' }, d: { bg: '#FEF3C7', color: '#92400E' },
            e: { bg: '#FCE7F3', color: '#9D174D' }, f: { bg: '#E0F2FE', color: '#0369A1' },
            g: { bg: '#FEE2E2', color: '#991B1B' }, h: { bg: '#ECFCCB', color: '#3F6212' },
            i: { bg: '#F0FDFB', color: '#0F766E' }, j: { bg: '#FDF4FF', color: '#7E22CE' },
          };

          const normalizeStatus = (s: any): string => {
            const val = (s || '').toString().toLowerCase().trim();
            if (['sent', 'completed', 'failed'].includes(val)) return val;
            return 'pending';
          };

          const grouped = columns.map(col => ({
            ...col,
            items: loading ? [] : applicants.filter(a => normalizeStatus(a.status) === col.key),
          })).filter(col => col.key === 'pending' || col.items.length > 0 || loading);

          return (
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 32 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(grouped.length, 3)}, 1fr)`,
              gap: 14, alignItems: 'start',
            }}>
              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} style={{
                    background: '#fff', border: '0.5px solid #E2E2EE',
                    borderRadius: 16, overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(30,29,76,.04)',
                  }}>
                    <div style={{ height: 48, background: '#F4F4F8' }} />
                    {[1,2].map(j => (
                      <div key={j} style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0F8' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EBEBF8' }} />
                          <div>
                            <div style={{ width: 100, height: 11, borderRadius: 6, background: '#EBEBF8', marginBottom: 6 }} />
                            <div style={{ width: 140, height: 9, borderRadius: 6, background: '#F4F4F8' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : grouped.map(col => (
                <div key={col.key} style={{
                  background: '#fff', border: '0.5px solid #E2E2EE',
                  borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(30,29,76,.04)',
                  animation: 'fadeUp .35s ease both',
                }}>
                  {/* Column Header */}
                  <div style={{
                    background: col.headerBg, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 8,
                    borderBottom: `2px solid ${col.accent}22`,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: col.headerColor, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      {col.label}
                    </span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                      background: '#fff', color: col.headerColor,
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      {col.items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {col.items.length === 0 ? (
                      <div style={{ padding: '24px 0', textAlign: 'center', color: '#C4C3D8', fontSize: 12 }}>
                        No applicants
                      </div>
                    ) : col.items.map(a => {
                      const name  = a.applicantName  || a.candidateName  || a.name  || 'Candidate';
                      const email = a.applicantEmail || a.candidateEmail || a.email || '';
                      const appId = String(a.id || a.applicationId || '');
                      const isSelected = selected.has(appId);
                      const letter = (name[0] || 'a').toLowerCase();
                      const av = avatarColors[letter] || { bg: '#EBEBF8', color: '#534AB7' };

                      return (
                        <div key={appId} style={{
                          background: isSelected ? '#F8F8FF' : '#FAFAFA',
                          border: isSelected ? `1.5px solid ${col.accent}55` : '1px solid #EFEFEF',
                          borderRadius: 12, padding: '12px 14px',
                          transition: 'all .15s',
                          borderLeft: `3px solid ${col.accent}`,
                        }}>
                          {/* Top row: checkbox + avatar + name */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(appId)}
                              style={{ accentColor: '#1E1D4C', width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }}
                            />
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: av.bg, color: av.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, fontWeight: 700, flexShrink: 0,
                              textTransform: 'uppercase',
                            }}>
                              {name[0]}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontSize: 13, fontWeight: 600, color: '#1E1D4C',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>{name}</div>
                              <div style={{
                                fontSize: 11, color: '#9998B8',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>{email}</div>
                            </div>
                          </div>

                          {/* Bottom row: match + buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                            <div>
                              {Number(a.matchPercentage || a.matchScore || 0) > 0 ? (
                                <span style={{
                                  background: '#E4F7F0', color: '#0f6e56',
                                  padding: '3px 10px', borderRadius: 20,
                                  fontWeight: 600, fontSize: 11,
                                }}>{Number(a.matchPercentage || a.matchScore || 0)}% match</span>
                              ) : null}
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {col.key === 'completed' && (
                                <button
                                  onClick={() => viewResults(appId)}
                                  style={{
                                    fontSize: 11, fontWeight: 600, color: '#5B21B6',
                                    background: '#EDE9FE', border: 'none',
                                    borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
                                    fontFamily: "'Inter', sans-serif",
                                    transition: 'opacity .15s',
                                  }}
                                >
                                  View results
                                </button>
                              )}
                              <button
                                onClick={() => sendOne(appId, email, name)}
                                style={{
                                  fontSize: 11, fontWeight: 600, color: '#1E1D4C',
                                  background: '#fff', border: '1.5px solid #E2E2EE',
                                  borderRadius: 20, padding: '5px 12px', cursor: 'pointer',
                                  fontFamily: "'Inter', sans-serif",
                                  transition: 'background .15s, color .15s, border-color .15s',
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#1E1D4C';
                                  (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#1E1D4C';
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                                  (e.currentTarget as HTMLButtonElement).style.color = '#1E1D4C';
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E2EE';
                                }}
                              >
                                Send link
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            </div>
          );
        })()}
      </main>

      <ConfirmModal {...confirm} onCancel={() => setConfirm(c => ({ ...c, open: false }))} />
      <ResultsModal
        open={results.open} candidateName={results.name}
        summary={results.summary} results={results.items}
        onClose={() => setResults(r => ({ ...r, open: false }))}
      />
    </div>
  );
};
