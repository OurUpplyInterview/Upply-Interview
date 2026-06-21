import { useState, useCallback, useRef } from "react";
import type { Question, QuestionResult, AppSection, ToastState } from "../types/interview";
import { apiSetup, apiEvaluate, apiComplete } from "../services/api";

export function useInterview() {
  const [section, setSection]       = useState<AppSection>("loading");
  const [errorMsg, setErrorMsg]     = useState("");
  const [token, setToken]           = useState("");
  const [jobTitle, setJobTitle]     = useState("");
  const [company, setCompany]       = useState("");
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults]       = useState<QuestionResult[]>([]);
  const [toast, setToast]           = useState<ToastState>({ message: "", type: "", visible: false });

  // Store transcripts without triggering re-renders
  const transcriptsRef = useRef<{ question: Question; transcript: string; index: number }[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3500);
  }, []);

  const init = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get("token") || "";
    setToken(tok);

    if (!tok) {
      setErrorMsg("No session token found in URL. Please use the link provided by your recruiter.");
      setSection("error");
      return;
    }

    try {
      const res = await apiSetup(tok);
      if (!res.ok || !res.questions?.length) {
        setErrorMsg(res.error || "Failed to load interview session.");
        setSection("error");
        return;
      }
      setQuestions(res.questions);
      setJobTitle(res.job_title || "");
      setCompany(res.company || "");
      setSection("welcome");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setSection("error");
    }
  }, []);

  const beginInterview = useCallback(() => {
    setCurrentIdx(0);
    setResults([]);
    transcriptsRef.current = [];
    setSection("interview");
  }, []);

  const submitAnswer = useCallback((transcript: string) => {
    const q = questions[currentIdx];
    if (!q || !transcript.trim()) return;

    // Save transcript for later evaluation
    transcriptsRef.current[currentIdx] = { question: q, transcript, index: currentIdx };

    // Mark as submitted with placeholder
    const placeholder: QuestionResult = {
      question: q.question,
      score:    -1,
      feedback: "Evaluating…",
      tip:      "",
    };
    setResults(prev => {
      const updated = [...prev];
      updated[currentIdx] = placeholder;
      return updated;
    });

    showToast("Answer submitted — great job!", "success");
  }, [questions, currentIdx, showToast]);

  const nextQuestion = useCallback(() => {
    setCurrentIdx(i => i + 1);
  }, [token]);

  const finishInterview = useCallback(async () => {
    // Go to summary immediately
    setSection("summary");

    try { await apiComplete(token); } catch { /* best effort */ }

    // Now evaluate all answers in parallel
    const entries = transcriptsRef.current.filter(Boolean);
    entries.forEach(({ question: q, transcript, index }) => {
      apiEvaluate({
        question:     q.question,
        model_answer: q.model_answer,
        user_answer:  transcript,
        token:        token,
        q_index:      index,
      }).then(res => {
        const result: QuestionResult = {
          question: q.question,
          score:    parseFloat(res.score) || 0,
          feedback: res.feedback,
          tip:      res.tip,
        };
        setResults(prev => {
          const updated = [...prev];
          updated[index] = result;
          return updated;
        });
      }).catch(() => {});
    });
  }, []);

  const retry = useCallback(() => {
    setCurrentIdx(0);
    setResults([]);
    transcriptsRef.current = [];
    setSection("welcome");
  }, [token]);

  return {
    section, errorMsg, jobTitle, company,
    questions, currentIdx, results, isSubmitting: false, toast,
    token,
    init, beginInterview, submitAnswer, nextQuestion, finishInterview, retry,
  };
}
