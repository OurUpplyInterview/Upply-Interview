// ── Auth ──────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}
export interface User {
  id?: string | number;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string | number;
}
export interface LoginResponse {
  token: string;
  tokenType?: string;
  expiresIn?: number;
  user?: User;
}
// ── Job ───────────────────────────────────────────────────────────────────
export interface Job {
  id: string | number;
  title: string;
  organizationName?: string;
  companyName?: string;
  company?: string;
  type?: string;
  seniority?: string;
  jobType?: string;
  model?: string;
  status?: string;
  jobSource?: string;
  location?: string;
  city?: string;
  country?: string;
  createdDate?: string;
  applicationCount?: number;
  applicationsCount?: number;
  description?: string;
  jobDescription?: string;
  jd?: string;
}
export interface PageResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
}
// ── Application ───────────────────────────────────────────────────────────
export type ApplicationStatus = 'PENDING' | 'INVITED' | 'IN_PROGRESS' | 'COMPLETED';
export interface Applicant {
  id: string | number;
  applicationId?: string | number;
  applicantName?: string;
  candidateName?: string;
  fullName?: string;
  name?: string;
  applicantEmail?: string;
  candidateEmail?: string;
  email?: string;
  appliedAt?: string;
  createdAt?: string;
  applicationDate?: string;
  matchPercentage?: number;
  matchScore?: number;
  score?: number;
  match?: number;
  status?: ApplicationStatus | string;
  interviewStatus?: string;
}
// ── Interview results ─────────────────────────────────────────────────────
export interface ResultItem {
  question: string;
  score: number;
  feedback: string;
  tip: string;
}
export interface ResultSummary {
  avg_score: number;
  best: number;
  worst: number;
  strong: number;
  total: number;
}
export interface InterviewResults {
  ok: boolean;
  session: { candidate_name?: string };
  summary: ResultSummary;
  results: ResultItem[];
}
// ── Send interview ────────────────────────────────────────────────────────
export interface SendTarget {
  id: string | number;
  email: string;
  name: string;
}
export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | '';
}
