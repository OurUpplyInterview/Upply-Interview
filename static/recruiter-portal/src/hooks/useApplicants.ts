import { useState, useCallback } from 'react';
import type { Applicant, SendTarget } from '../interfaces';
import { applicationsService, interviewService, storage } from '../services/api';

export function useApplicants() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selected,   setSelected]   = useState<Set<string>>  (new Set());
  const [loading,    setLoading]    = useState(false);

  const fetchApplicants = useCallback(async (jobId: string | number) => {
    setLoading(true);
    setSelected(new Set());
    try {
      const data = await applicationsService.getApplications(jobId);
      setApplicants(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelected(new Set(applicants.map(a => String(a.id || a.applicationId))));
    } else {
      setSelected(new Set());
    }
  }, [applicants]);

  const markInvited = useCallback((ids: (string | number)[]) => {
    setApplicants(prev =>
      prev.map(a =>
        ids.some(id => String(id) === String(a.id || a.applicationId))
          ? { ...a, status: 'INVITED' }
          : a
      )
    );
  }, []);

  const sendInterviews = useCallback(async (
    targets: SendTarget[],
    jobId: string | number,
    jobTitle: string,
    company: string,
    jd: string,
    numQuestions: number
  ) => {
    const data = await interviewService.sendBulk({
      job_id: jobId,
      job_title: jobTitle,
      company,
      jd,
      num_questions: numQuestions,
      applicants: targets,
    });

    if (data.ok) {
      // Update local status
      markInvited(targets.map(t => t.id));

      // Notify Upply (non-blocking)
      const token = storage.getToken();
      const realIds = targets
        .map(t => t.id)
        .filter(id => id && !String(id).startsWith('manual-'));
      if (realIds.length && token) {
        interviewService.notifyInvited(token, realIds).catch(console.warn);
      }
    }

    return data;
  }, [markInvited]);

  const selectedApplicants = applicants.filter(
    a => selected.has(String(a.id || a.applicationId))
  );

  return {
    applicants, loading, selected, selectedApplicants,
    fetchApplicants, toggleSelect, toggleAll, markInvited, sendInterviews,
  };
}
