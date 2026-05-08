export interface Question {
  question: string;
  model_answer: string;
}

export interface QuestionResult {
  question: string;
  score: number;
  feedback: string;
  tip: string;
}

export interface SetupResponse {
  ok: boolean;
  questions?: Question[];
  job_title?: string;
  company?: string;
  error?: string;
}

export interface TranscribeResponse {
  ok: boolean;
  transcript: string;
  error?: string;
}

export interface EvaluateResponse {
  score: string;
  feedback: string;
  tip: string;
  cleaned: string;
}

export interface CompleteResponse {
  ok: boolean;
  error?: string;
}

export type AppSection = "loading" | "error" | "welcome" | "interview" | "summary";
export type Difficulty = "easy" | "medium" | "hard";
export type ToastType = "success" | "error" | "";

export interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}
