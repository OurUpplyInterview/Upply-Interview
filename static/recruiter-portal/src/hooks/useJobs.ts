import { useState, useCallback, useEffect } from 'react';
import type { Job } from '../interfaces';
import { jobsService } from '../services/api';

// ── Singleton store ────────────────────────────────────────────────────────────
let _jobs: Job[] = [];
let _status: 'idle' | 'loading' | 'done' = 'idle';
const _listeners: Array<(jobs: Job[]) => void> = [];

function notify(jobs: Job[]) {
  _jobs = jobs;
  _listeners.forEach(fn => fn([..._jobs]));
}

export function clearJobsCache() {
  _jobs = [];
  _status = 'idle';
}

async function loadJobs() {
  if (_status === 'loading' || _status === 'done') return;
  _status = 'loading';
  try {
    const data = await jobsService.getJobs();
    notify(data);
    _status = 'done';
  } catch {
    _status = 'idle';
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useJobs() {
  const [jobs,    setJobs]    = useState<Job[]>(_jobs);
  const [loading, setLoading] = useState(_status === 'loading');

  useEffect(() => {
    _listeners.push(setJobs);
    if (_jobs.length > 0) setJobs([..._jobs]);
    return () => {
      const idx = _listeners.indexOf(setJobs);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  }, []);

  const fetchJobs = useCallback(async () => {
    if (_status === 'done' && _jobs.length > 0) {
      setJobs([..._jobs]);
      return;
    }
    setLoading(true);
    await loadJobs();
    setLoading(false);
  }, []);

  return { jobs, loading, error: null, fetchJobs, totalApplicants: 0 };
}