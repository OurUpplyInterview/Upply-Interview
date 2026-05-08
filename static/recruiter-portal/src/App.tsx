import React, { useState } from 'react';
import type { Job } from './interfaces';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Modals';
import { LoginPage } from './pages/LoginPage';
import { CreateInterviewPage } from './pages/CreateInterviewPage';
import { JobsDashPage } from './pages/JobsDashPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { InterviewsPage } from './pages/InterviewsPage';   // ← NEW

type Page = 'login' | 'create' | 'jobs' | 'detail' | 'interviews';  // ← added 'interviews'

export default function App() {
  const auth = useAuth();
  const { toast, showToast } = useToast();
  const [page, setPage] = useState<Page>(auth.isAuthenticated ? 'create' : 'login');
  const [currentJob, setCurrentJob] = useState<Job | null>(null);

  const handleLogin = async (email: string, password: string) => {
    const result = await auth.login(email, password);
    if (result.success) {
      if (result.isMock) showToast('⚠️ Backend unavailable — running in demo mode', 'info');
      setPage('create');
    }
    return result;
  };

  const handleLogout = () => {
    auth.logout();
    setPage('login');
    setCurrentJob(null);
  };

  const handleSelectJob = (job: Job) => {
    setCurrentJob(job);
    setPage('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setPage('jobs');
    setCurrentJob(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToInterviews = () => {
    setPage('interviews');                       // ← now goes to the real Interviews page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#F4F4F8', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes shimmer { to { background-position: -200% 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        input  { font-family: 'Inter', sans-serif; }
        button { font-family: 'Inter', sans-serif; }
      `}</style>

      {page !== 'login' && (
        <Navbar
          user={auth.user}
          onSignOut={handleLogout}
          onCreateInterview={() => { setPage('create'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onNavigateToJobs={() => { setPage('jobs'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onNavigateToInterviews={handleGoToInterviews}
          activePage={page === 'interviews' ? 'interviews' : 'jobs'}  // ← fixed active state
        />
      )}

      {page === 'login' && (
        <LoginPage onLogin={handleLogin} loading={auth.loading} error={auth.error} />
      )}
      {page === 'create' && (
        <CreateInterviewPage
          user={auth.user}
          onStart={() => { setPage('jobs'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onBrowse={() => { setPage('jobs'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        />
      )}
      {page === 'jobs' && (
        <JobsDashPage
          onSelectJob={handleSelectJob}
          onNavigateToInterviews={handleGoToInterviews}
          onSignOut={handleLogout}
          user={auth.user}
        />
      )}
      {page === 'detail' && currentJob && (
        <JobDetailPage job={currentJob} onBack={handleBack} showToast={showToast} />
      )}
      {page === 'interviews' && (                          // ← NEW
        <InterviewsPage user={auth.user} />
      )}

      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
    </div>
  );
}
