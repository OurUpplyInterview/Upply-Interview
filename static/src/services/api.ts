import type {
  SetupResponse,
  TranscribeResponse,
  EvaluateResponse,
  CompleteResponse,
} from "../types/interview";

export async function apiSetup(token: string): Promise<SetupResponse> {
  const fd = new FormData();
  fd.append("token", token);
  const res = await fetch("/setup", { method: "POST", body: fd });
  return res.json();
}

export async function apiComplete(token: string): Promise<CompleteResponse> {
  const fd = new FormData();
  fd.append("token", token);
  const res = await fetch("/complete", { method: "POST", body: fd });
  return res.json();
}

export async function apiSpeak(text: string): Promise<Blob> {
  const fd = new FormData();
  fd.append("text", text);
  const res = await fetch("/speak", { method: "POST", body: fd });
  if (!res.ok) throw new Error("TTS failed");
  return res.blob();
}

export async function apiTranscribe(
  blob: Blob,
  filename: string
): Promise<TranscribeResponse> {
  const fd = new FormData();
  fd.append("audio", blob, filename);
  const res = await fetch("/transcribe", { method: "POST", body: fd });
  return res.json();
}

export interface EvaluatePayload {
  question: string;
  model_answer: string;
  user_answer: string;
  token: string;
  q_index: number;
}

export async function apiEvaluate(payload: EvaluatePayload): Promise<EvaluateResponse> {
  const fd = new FormData();
  fd.append("question",     payload.question);
  fd.append("model_answer", payload.model_answer);
  fd.append("user_answer",  payload.user_answer);
  fd.append("token",        payload.token);
  fd.append("q_index",      String(payload.q_index));
  const res = await fetch("/evaluate", { method: "POST", body: fd });
  return res.json();
}
