import { useState, useCallback } from "react";
import { apiSpeak } from "../services/api";

export type TTSState = "idle" | "loading" | "playing";

export function useTTS() {
  const [ttsState, setTtsState] = useState<TTSState>("idle");

  const speak = useCallback(async (text: string) => {
    if (ttsState !== "idle") return;
    setTtsState("loading");
    try {
      const blob = await apiSpeak(text);
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      setTtsState("playing");
      audio.onended = () => {
        setTtsState("idle");
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setTtsState("idle");
        URL.revokeObjectURL(url);
      };
      audio.play();
    } catch {
      setTtsState("idle");
    }
  }, [ttsState]);

  return { ttsState, speak };
}
