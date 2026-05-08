export default function PoweredCard() {
  return (
    <div className="powered-card">
      <div className="powered-inner">
        <div className="powered-logo">
          Up<span>ply</span>
        </div>
        <div className="powered-label">AI Interview System</div>
      </div>
      <div className="powered-sep" />
      <div className="powered-status">
        <span className="status-pulse" />
        All systems operational
      </div>
      <div className="powered-tip">
        <span className="tip-icon">💡</span>
        <span>Speak clearly and answer in complete sentences for the best score.</span>
      </div>
    </div>
  );
}
