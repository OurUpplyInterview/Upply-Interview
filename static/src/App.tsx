import { useEffect } from "react";
import { useInterview } from "./hooks/useInterview";
import { useRecorder }  from "./hooks/useRecorder";
import { useTTS }       from "./hooks/useTTS";
import NavBar           from "./components/NavBar";
import HeroSection      from "./components/HeroSection";
import WelcomeSection   from "./components/WelcomeSection";
import InterviewSection from "./components/InterviewSection";
import SummarySection   from "./components/SummarySection";
import Toast            from "./components/Toast";

export default function App() {
  const iv  = useInterview();
  const rec = useRecorder();
  const tts = useTTS();

  useEffect(() => { iv.init(); }, []);

  // Reset recorder when question changes
  useEffect(() => { rec.resetRecorder(); }, [iv.currentIdx]);

  async function handleSubmit() {
    if (!rec.transcript.trim()) return;
    await iv.submitAnswer(rec.transcript);
  }

  return (
    <div className="app">
      <NavBar />

      <div className="layout">
        {/* Left hero panel */}
        <HeroSection />

        {/* Right main panel */}
        <main className="main-panel">
          {iv.section === "loading" && (
            <div className="state-center">
              <div className="loading-ring" />
              <div className="state-text">Loading your interview…</div>
            </div>
          )}

          {iv.section === "error" && (
            <div className="state-center">
              <div className="error-icon">⚠</div>
              <div className="state-text error-text">{iv.errorMsg}</div>
            </div>
          )}

          {iv.section === "welcome" && (
            <WelcomeSection
              jobTitle={iv.jobTitle}
              company={iv.company}
              questionCount={iv.questions.length}
              onBegin={iv.beginInterview}
            />
          )}

          {iv.section === "interview" && (
            <InterviewSection
              questions={iv.questions}
              currentIdx={iv.currentIdx}
              results={iv.results}
              isSubmitting={iv.isSubmitting}
              isRecording={rec.isRecording}
              isTranscribing={rec.isTranscribing}
              timerSecs={rec.timerSecs}
              transcript={rec.transcript}
              recordError={rec.recordError}
              onToggleRecord={rec.toggleRecord}
              ttsState={tts.ttsState}
              onListen={() => tts.speak(iv.questions[iv.currentIdx]?.question ?? "")}
              onSubmit={handleSubmit}
              onNext={iv.nextQuestion}
              onFinish={iv.finishInterview}
            />
          )}

          {iv.section === "summary" && (
            <SummarySection
              results={iv.results}
            />
          )}
        </main>
      </div>

      <Toast {...iv.toast} />
    </div>
  );
}
