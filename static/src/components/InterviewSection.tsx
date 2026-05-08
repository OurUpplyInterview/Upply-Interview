import type { Question, QuestionResult, Difficulty } from "../types/interview";
import type { TTSState } from "../hooks/useTTS";
import RecordArea from "./RecordArea";
import StepList from "./StepList";

interface Props {
  questions: Question[];
  currentIdx: number;
  results: QuestionResult[];
  isSubmitting: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  timerSecs: number;
  transcript: string;
  recordError: string;
  onToggleRecord: () => void;
  ttsState: TTSState;
  onListen: () => void;
  onSubmit: () => void;
  onNext: () => void;
  onFinish: () => void;
}

function getDifficulty(idx: number, total: number): Difficulty {
  const ne = Math.max(1, Math.floor(total / 3));
  if (idx < ne) return "easy";
  if (idx < ne * 2) return "medium";
  return "hard";
}

const DIFF_LABEL: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

export default function InterviewSection(props: Props) {
  const {
    questions, currentIdx, results, isSubmitting,
    isRecording, isTranscribing, timerSecs, transcript, recordError,
    onToggleRecord, ttsState, onListen, onSubmit, onNext, onFinish,
  } = props;

  const q        = questions[currentIdx];
  const total    = questions.length;
  const diff     = getDifficulty(currentIdx, total);
  const answered = results.length > currentIdx;
  const isLast   = currentIdx >= total - 1;
  const pct      = Math.round(((answered ? currentIdx + 1 : currentIdx) / total) * 100);

  return (
    <div className="two-col">
      <div className="interview-main">
        {/* Progress bar */}
        <div className="q-progress">
          <div className="q-progress-bar">
            <div className="q-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="q-progress-label">{currentIdx + 1} of {total}</span>
        </div>

        {/* Question card */}
        <div className="q-card">
          <div className="q-meta-row">
            <span className={`q-diff q-diff-${diff}`}>{DIFF_LABEL[diff]}</span>
            <span className="q-num">Question {currentIdx + 1}</span>
          </div>

          <div className="q-text">{q?.question}</div>

          <button
            className={`listen-btn${ttsState !== "idle" ? " listen-active" : ""}`}
            onClick={onListen}
            disabled={ttsState !== "idle"}
          >
            {ttsState === "loading" ? (
              <><span className="btn-spinner" /> Loading audio…</>
            ) : ttsState === "playing" ? (
              <><span className="sound-bars"><span /><span /><span /></span> Playing…</>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <circle cx="7.5" cy="7.5" r="7.5" fill="rgba(52,168,83,0.15)" />
                  <path d="M6 5l4 2.5L6 10V5z" fill="#34A853" />
                </svg>
                Listen to question
              </>
            )}
          </button>

          <div className="q-divider" />

          <RecordArea
            isRecording={isRecording}
            isTranscribing={isTranscribing}
            timerSecs={timerSecs}
            transcript={transcript}
            recordError={recordError}
            onToggle={onToggleRecord}
          />

          {answered && (
            <div className="answered-banner">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="9" fill="rgba(52,168,83,0.15)" />
                <path d="M5 9l3 3 5-5" stroke="#34A853" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Answer submitted — AI is evaluating…
            </div>
          )}

          <div className="q-actions">
            <button
              className="btn-submit"
              onClick={onSubmit}
              disabled={!transcript.trim() || answered || isSubmitting}
            >
              {isSubmitting ? (
                <><span className="btn-spinner" /> Evaluating…</>
              ) : answered ? (
                "Submitted"
              ) : (
                "Submit Answer"
              )}
            </button>

            {answered && !isLast && (
              <button className="btn-next" onClick={onNext}>
                Next Question
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {answered && isLast && (
              <button className="btn-next" onClick={onFinish}>
                View Report
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="interview-side">
        <StepList
          questions={questions}
          currentIdx={currentIdx}
          answeredCount={results.length}
        />
      </div>
    </div>
  );
}
