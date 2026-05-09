import type { LoginRequest, LoginResponse, Job, Applicant, PageResponse, InterviewResults, SendTarget } from '../interfaces';

// ── Token storage ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'upply_r_token';
const USER_KEY  = 'upply_r_user';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  getUser:  () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; } },
  setUser:  (u: object) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clear:    () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
};

// ── Base fetch through FastAPI proxy ──────────────────────────────────────────
async function upplyFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = storage.getToken();
  const url = `/proxy/${path.replace(/^\//, '')}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401) throw new Error('SESSION_EXPIRED');
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Normalize a raw Upply applicant object into our Applicant type ────────────
function normalizeApplicant(raw: Record<string, unknown>): Applicant {
  const firstName = String(raw.firstName || raw.first_name || '').trim();
  const lastName  = String(raw.lastName  || raw.last_name  || '').trim();
  const fullName  = [firstName, lastName].filter(Boolean).join(' ');

  const resolvedName =
    String(raw.applicantName  || '').trim() ||
    String(raw.candidateName  || '').trim() ||
    String(raw.fullName       || '').trim() ||
    fullName                                ||
    String(raw.displayName    || '').trim() ||
    (() => {
      const email = String(raw.applicantEmail || raw.candidateEmail || raw.email || '');
      if (email.includes('@')) {
        return email.split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
      }
      return '';
    })() ||
    String(raw.name || '').trim() ||
    'Candidate';

  const resolvedEmail =
    String(raw.applicantEmail || raw.candidateEmail || raw.email || '').trim();

  console.log(`🔍 Raw applicant keys: ${Object.keys(raw).join(', ')}`);
  console.log(`👤 Resolved → name: "${resolvedName}" | email: "${resolvedEmail}"`);

  return {
    id:              (raw.id || raw.applicationId) as string | number,
    applicationId:   (raw.applicationId || raw.id) as string | number,
    applicantName:   resolvedName.split(' ')[0],
    candidateName:   resolvedName.split(' ')[0],
    name:            resolvedName.split(' ')[0],
    applicantEmail:  resolvedEmail,
    candidateEmail:  resolvedEmail,
    email:           resolvedEmail,
    appliedAt:       String(raw.appliedAt || raw.createdAt || raw.applicationDate || ''),
    matchPercentage: Number(raw.matchPercentage || raw.matchScore || raw.score || raw.match || 0),
    status:          String(raw.status || raw.interviewStatus || 'PENDING') as Applicant['status'],
  };
}

// ── Auth service ──────────────────────────────────────────────────────────────
export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch('/recruiter/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json() as LoginResponse & { message?: string; detail?: string; accessToken?: string; access_token?: string };
      if (!res.ok) throw new Error(data.message || data.detail || 'Invalid credentials');
      const token = data.token || data.accessToken || data.access_token;
      if (!token) throw new Error('No token received.');
      return { ...data, token };
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      if ((e as Error).name === 'AbortError' || (e as Error).message?.includes('fetch')) {
        return {
          token: `mock-token-${Date.now()}`,
          user: { name: payload.email.split('@')[0], email: payload.email },
          _isMock: true,
        } as LoginResponse & { _isMock: boolean };
      }
      throw e;
    }
  },
};

// ── Jobs service ──────────────────────────────────────────────────────────────
const MOCK_JOBS: Job[] = [
  { id:'job-001', title:'Frontend Developer',  organizationName:'Upply Tech', type:'Full-time',  location:'Cairo',      applicationCount:4, description:'React, TypeScript, HTML5, CSS3, REST APIs.' },
  { id:'job-002', title:'Backend Engineer',    organizationName:'Upply Tech', type:'Full-time',  location:'Remote',     applicationCount:6, description:'Java Spring Boot, microservices, PostgreSQL, Docker.' },
  { id:'job-003', title:'Data Scientist',      organizationName:'Upply Tech', type:'Part-time',  location:'Alexandria', applicationCount:3, description:'Python, ML, pandas, NumPy, scikit-learn, TensorFlow.' },
  { id:'job-004', title:'DevOps Engineer',     organizationName:'Upply Tech', type:'Full-time',  location:'Remote',     applicationCount:2, description:'Docker, Kubernetes, Jenkins, GitHub Actions, Terraform.' },
];

export const jobsService = {
  async getMyOrgId(): Promise<string | number | null> {
    try {
      const me = await upplyFetch<Record<string, unknown>>('/user/me');
      const orgId =
        (me.organizationId as string | number) ||
        ((me.organization as Record<string, unknown>)?.id as string | number) ||
        null;
      return orgId;
    } catch {
      return null;
    }
  },

  async getJobs(): Promise<Job[]> {
    try {
      // Fetch only the recruiter's own organisation jobs
      const orgId = await jobsService.getMyOrgId();
      if (orgId) {
        const data = await upplyFetch<Job[] | PageResponse<Job>>(`/organizations/${orgId}/jobs`);
        if (Array.isArray((data as PageResponse<Job>).content)) return (data as PageResponse<Job>).content;
        if (Array.isArray(data)) return data as Job[];
      }
      // Fallback: all jobs (if no org linked to account)
      const data = await upplyFetch<Job[] | PageResponse<Job>>('/jobs');
      if (Array.isArray((data as PageResponse<Job>).content)) return (data as PageResponse<Job>).content;
      if (Array.isArray(data)) return data as Job[];
      return [];
    } catch (e) {
      console.warn('Jobs API failed, using mock:', (e as Error).message);
      return MOCK_JOBS;
    }
  },

  async getJob(jobId: string | number): Promise<Job | null> {
    try {
      return await upplyFetch<Job>(`/jobs/${jobId}`);
    } catch {
      return MOCK_JOBS.find(j => j.id === jobId) || null;
    }
  },
};

// ── Applications service ──────────────────────────────────────────────────────
const MOCK_APPLICANTS: Record<string, Applicant[]> = {
  'job-001': [
    { id:'app-001', applicantName:'Mohamed Ahmed', applicantEmail:'mohamed.ahmed@gmail.com', appliedAt:'2026-04-20', matchPercentage:85, status:'PENDING' },
    { id:'app-002', applicantName:'Sara Hassan',   applicantEmail:'sara.hassan@outlook.com',  appliedAt:'2026-04-21', matchPercentage:72, status:'INVITED' },
    { id:'app-003', applicantName:'Ali Mahmoud',   applicantEmail:'ali.mahmoud@yahoo.com',    appliedAt:'2026-04-22', matchPercentage:91, status:'COMPLETED' },
    { id:'app-004', applicantName:'Nour El-Din',   applicantEmail:'nour.eldin@gmail.com',     appliedAt:'2026-04-23', matchPercentage:68, status:'PENDING' },
  ],
  'job-002': [
    { id:'app-005', applicantName:'Ahmed Samy',   applicantEmail:'ahmed.samy@gmail.com',    appliedAt:'2026-04-18', matchPercentage:78, status:'PENDING' },
    { id:'app-006', applicantName:'Layla Ibrahim',applicantEmail:'layla.ibrahim@gmail.com',  appliedAt:'2026-04-19', matchPercentage:88, status:'INVITED' },
    { id:'app-007', applicantName:'Omar Khalil',  applicantEmail:'omar.khalil@hotmail.com',  appliedAt:'2026-04-20', matchPercentage:65, status:'PENDING' },
    { id:'app-008', applicantName:'Hana Mostafa', applicantEmail:'hana.mostafa@gmail.com',   appliedAt:'2026-04-21', matchPercentage:93, status:'COMPLETED' },
  ],
  'job-003': [
    { id:'app-011', applicantName:'Karim Nasser', applicantEmail:'karim.nasser@gmail.com',   appliedAt:'2026-04-19', matchPercentage:89, status:'PENDING' },
    { id:'app-012', applicantName:'Mariam Tarek', applicantEmail:'mariam.tarek@gmail.com',   appliedAt:'2026-04-21', matchPercentage:76, status:'INVITED' },
  ],
  'job-004': [
    { id:'app-014', applicantName:'Rania Hossam', applicantEmail:'rania.hossam@gmail.com',   appliedAt:'2026-04-22', matchPercentage:87, status:'PENDING' },
    { id:'app-015', applicantName:'Sherif Wagdy', applicantEmail:'sherif.wagdy@outlook.com', appliedAt:'2026-04-24', matchPercentage:74, status:'PENDING' },
  ],
};

export const applicationsService = {
  async getApplications(jobId: string | number): Promise<Applicant[]> {
    try {
      const data = await upplyFetch<Record<string, unknown>[] | PageResponse<Record<string, unknown>>>(`/jobs/${jobId}/applications`);
      let raw: Record<string, unknown>[] = [];
      if (Array.isArray((data as PageResponse<Record<string, unknown>>).content)) {
        raw = (data as PageResponse<Record<string, unknown>>).content;
      } else if (Array.isArray(data)) {
        raw = data as Record<string, unknown>[];
      }
      return raw.map(normalizeApplicant);
    } catch (e) {
      console.warn('Applications API failed, using mock:', (e as Error).message);
      return MOCK_APPLICANTS[String(jobId)] || [];
    }
  },

  async patchStatus(applicationId: string | number, status: string): Promise<void> {
    await upplyFetch(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// ── Interview service ─────────────────────────────────────────────────────────
export const interviewService = {
 async sendBulk(payload: {
    job_id: string | number;
    job_title: string;
    company: string;
    jd: string;
    num_questions: number;
    applicants: SendTarget[];
  }): Promise<{ ok: boolean; results: Array<{ email_sent: boolean }>; error?: string }> {
    const token = storage.getToken();
    const res = await fetch('/recruiter/create-bulk', {
    method: 'POST',
     headers: {
       'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify(payload),
});
    return res.json();
  },

  async notifyInvited(token: string, application_ids: (string | number)[]): Promise<void> {
    await fetch('/recruiter/notify-invited', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, application_ids }),
    });
  },

  async getResults(jobId: string | number, appId: string | number): Promise<InterviewResults | null> {
    try {
      const sess = await fetch(`/recruiter/sessions?job_id=${jobId}`).then(r => r.json()) as { sessions: Array<{ application_id: string | number; token: string }> };
      const s = (sess.sessions || []).find(s => String(s.application_id) === String(appId));
      if (!s) return null;
      return fetch(`/recruiter/session/${s.token}/results`).then(r => r.json());
    } catch {
      return null;
    }
  },
};
