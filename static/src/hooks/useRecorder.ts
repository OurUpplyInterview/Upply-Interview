import { useState, useRef, useCallback } from "react";
import { apiTranscribe } from "../services/api";

export interface RecorderState {
  isRecording: boolean;
  isTranscribing: boolean;
  timerSecs: number;
  transcript: string;
  recordError: string;
}

export function useRecorder() {
  const [isRecording, setIsRecording]     = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [timerSecs, setTimerSecs]         = useState(0);
  const [transcript, setTranscript]       = useState("");
  const [recordError, setRecordError]     = useState("");

  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async () => {
    setRecordError("");
    setTranscript("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current  = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setIsTranscribing(true);
        try {
          const res = await apiTranscribe(blob, "recording.webm");
          if (res.ok) setTranscript(res.transcript);
          else setRecordError(res.error || "Transcription failed");
        } catch {
          setRecordError("Network error during transcription");
        } finally {
          setIsTranscribing(false);
        }
      };

      mr.start();
      setIsRecording(true);
      setTimerSecs(0);
      timerRef.current = setInterval(() => setTimerSecs(s => s + 1), 1000);
    } catch {
      setRecordError("Microphone access denied. Please allow microphone access.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRef.current?.stop();
    setIsRecording(false);
  }, []);

  const toggleRecord = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const resetRecorder = useCallback(() => {
    setTranscript("");
    setRecordError("");
    setTimerSecs(0);
    setIsRecording(false);
    setIsTranscribing(false);
  }, []);

  return {
    isRecording, isTranscribing, timerSecs, transcript, recordError,
    toggleRecord, resetRecorder, setTranscript,
  };
}
