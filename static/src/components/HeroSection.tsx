export default function HeroSection() {
  return (
    <div className="hero">
      {/* Moving background shapes */}
      <div className="hero-shapes" aria-hidden="true">
        <div className="hero-shape hero-shape-1" />
        <div className="hero-shape hero-shape-2" />
        <div className="hero-shape hero-shape-3" />
        <div className="hero-shape hero-shape-4" />
        <div className="hero-shape hero-shape-5" />
        <div className="hero-shape hero-shape-6" />
      </div>

      <div className="hero-inner">
        <h1 className="hero-title">
          Hire not just<br />
          for skills, but<br />
          <span className="hero-title-accent">for mindset</span>
        </h1>

        <p className="hero-sub">
          Speak naturally. Get scored instantly. Leave with insights.
        </p>
      </div>

      <div className="hero-orb hero-orb-1" aria-hidden="true" />
      <div className="hero-orb hero-orb-2" aria-hidden="true" />
    </div>
  );
}
