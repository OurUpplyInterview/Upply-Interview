import type { ToastState } from "../types/interview";

export default function Toast({ message, type, visible }: ToastState) {
  return (
    <div className={`toast toast-${type}${visible ? " toast-show" : ""}`} role="alert" aria-live="polite">
      <span className="toast-icon">{type === "success" ? "✓" : "✕"}</span>
      {message}
    </div>
  );
}
