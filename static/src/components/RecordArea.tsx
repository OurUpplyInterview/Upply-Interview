interface Props {
  isRecording: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  timerSecs: number;
  transcript: string;
  recordError: string;
  onToggle: () => void;
}

function fmtTime(secs: number) {
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function RecordArea({
  isRecording, isTranscribing, isSpeaking, timerSecs, transcript, recordError, onToggle,
}: Props) {
  const status = isTranscribing
    ? "Transcribing your answer…"
    : isRecording
    ? "Recording — click to stop"
    : isSpeaking
    ? "Please wait for the question to finish…"
    : recordError || (transcript ? "Answer captured ✓" : "Click to start recording");

  return (
    <div className="record-area">
      <button
        className={`record-btn${isRecording ? " rec-active" : ""}${isTranscribing ? " rec-processing" : ""}`}
        onClick={onToggle}
        disabled={isTranscribing || isSpeaking}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        {isRecording ? (
          <>
            <span className="rec-stop-icon" />
            <span className="rec-timer">{fmtTime(timerSecs)}</span>
          </>
        ) : isTranscribing ? (
          <span className="rec-spinner" />
        ) : (
          <span className="rec-mic-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="9" y="2" width="10" height="16" rx="5" fill="currentColor" />
              <path d="M4 14a10 10 0 0020 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
              <line x1="14" y1="24" x2="14" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="10" y1="28" x2="18" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        )}
        {isRecording && <span className="rec-ring" />}
      </button>

      <div className={`rec-status${recordError ? " rec-status-err" : ""}`}>
        {status}
      </div>

      {transcript && !isTranscribing && (
        <div className="transcript-block">
          <div className="transcript-label">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="6" fill="rgba(52,168,83,0.15)" />
              <path d="M3 6l2 2 4-4" stroke="#34A853" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Your answer
          </div>
          <div className="transcript-text">{transcript}</div>
        </div>
      )}
    </div>
  );
}
