import { useState, useEffect } from "react";

const THEMES = ["bot", "gear", "neural", "metrics"] as const;
type Theme = (typeof THEMES)[number];

export const HeroCarousel = () => {
  const [current, setCurrent] = useState<Theme>("bot");
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => {
          const idx = THEMES.indexOf(prev);
          return THEMES[(idx + 1) % THEMES.length];
        });
        setFading(false);
      }, 400);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (t: Theme) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(t);
      setFading(false);
    }, 400);
  };

  return (
    <div className="hc-wrap">
      <div
        className="hc-panel"
        style={{ opacity: fading ? 0 : 1, transition: "opacity 0.4s ease" }}
      >
        {current === "bot" && <ThemeBot />}
        {current === "gear" && <ThemeGear />}
        {current === "neural" && <ThemeNeural />}
        {current === "metrics" && <ThemeMetrics />}
      </div>

      <div className="hc-dots">
        {THEMES.map((t) => (
          <button
            key={t}
            className={`hc-dot ${current === t ? "active" : ""}`}
            onClick={() => goTo(t)}
          />
        ))}
      </div>
    </div>
  );
};

const ThemeBot = () => (
  <div className="hc-theme-center">
    <div className="hc-bot">
      <div className="hc-bot-ring ring-1" />
      <div className="hc-bot-ring ring-2" />
      <div className="hc-bot-ring ring-3" />
      <div className="hc-bot-body">
        <div className="hc-bot-eyes">
          <div className="hc-bot-eye" />
          <div className="hc-bot-eye eye-2" />
        </div>
        <div className="hc-bot-mouth" />
        <div className="hc-bot-dots">
          <div className="hc-bot-dot" />
          <div className="hc-bot-dot" />
          <div className="hc-bot-dot" />
        </div>
      </div>
    </div>
    <div className="hc-theme-label">
      COMPSOL <span>RDR</span> &middot; Automação
    </div>
  </div>
);

const ThemeGear = () => (
  <div className="hc-theme-center">
    <svg
      width="220"
      height="220"
      viewBox="0 0 220 220"
      style={{ animation: "spin 12s linear infinite" }}
    >
      <g transform="translate(110,110)">
        <circle r="40" fill="rgba(130,10,209,0.1)" stroke="#820AD1" strokeWidth="0.5" />
        <circle r="22" fill="rgba(130,10,209,0.06)" stroke="#820AD1" strokeWidth="0.5" />
        <circle r="8" fill="#820AD1" />
        <g stroke="#820AD1" strokeWidth="6" strokeLinecap="round">
          <line x1="0" y1="-52" x2="0" y2="-66" />
          <line x1="0" y1="52" x2="0" y2="66" />
          <line x1="-52" y1="0" x2="-66" y2="0" />
          <line x1="52" y1="0" x2="66" y2="0" />
          <line x1="-37" y1="-37" x2="-47" y2="-47" />
          <line x1="37" y1="37" x2="47" y2="47" />
          <line x1="37" y1="-37" x2="47" y2="-47" />
          <line x1="-37" y1="37" x2="-47" y2="47" />
        </g>
        <circle
          r="76"
          fill="none"
          stroke="rgba(130,10,209,0.1)"
          strokeWidth="0.5"
          strokeDasharray="10 10"
        />
      </g>
    </svg>
    <div className="hc-theme-label">
      COMPSOL <span>RDR</span> &middot; Automação RPA
    </div>
  </div>
);

const ThemeNeural = () => (
  <div className="hc-theme-center">
    <svg width="320" height="200" viewBox="0 0 280 180">
      <line x1="30" y1="90" x2="90" y2="30" stroke="rgba(130,10,209,0.3)" strokeWidth="0.5" />
      <line x1="30" y1="90" x2="90" y2="90" stroke="rgba(130,10,209,0.3)" strokeWidth="0.5" />
      <line x1="30" y1="90" x2="90" y2="150" stroke="rgba(130,10,209,0.3)" strokeWidth="0.5" />
      <line x1="90" y1="30" x2="165" y2="60" stroke="rgba(130,10,209,0.4)" strokeWidth="0.5" />
      <line x1="90" y1="90" x2="165" y2="60" stroke="rgba(130,10,209,0.4)" strokeWidth="0.5" />
      <line x1="90" y1="90" x2="165" y2="120" stroke="rgba(130,10,209,0.4)" strokeWidth="0.5" />
      <line x1="90" y1="150" x2="165" y2="120" stroke="rgba(130,10,209,0.4)" strokeWidth="0.5" />
      <line x1="165" y1="60" x2="248" y2="90" stroke="#820AD1" strokeWidth="1.5" />
      <line x1="165" y1="120" x2="248" y2="90" stroke="#820AD1" strokeWidth="1.5" />
      <circle cx="30" cy="90" r="14" fill="rgba(130,10,209,0.15)" stroke="#820AD1" strokeWidth="0.5" style={{ animation: "nodePulse 2s infinite" }} />
      <circle cx="90" cy="30" r="9" fill="rgba(130,10,209,0.1)" stroke="#820AD1" strokeWidth="0.5" style={{ animation: "nodePulse 2s .2s infinite" }} />
      <circle cx="90" cy="90" r="9" fill="rgba(130,10,209,0.1)" stroke="#820AD1" strokeWidth="0.5" style={{ animation: "nodePulse 2s .4s infinite" }} />
      <circle cx="90" cy="150" r="9" fill="rgba(130,10,209,0.1)" stroke="#820AD1" strokeWidth="0.5" style={{ animation: "nodePulse 2s .6s infinite" }} />
      <circle cx="165" cy="60" r="12" fill="rgba(130,10,209,0.15)" stroke="#820AD1" strokeWidth="0.5" style={{ animation: "nodePulse 2s .3s infinite" }} />
      <circle cx="165" cy="120" r="12" fill="rgba(130,10,209,0.15)" stroke="#820AD1" strokeWidth="0.5" style={{ animation: "nodePulse 2s .5s infinite" }} />
      <circle cx="248" cy="90" r="22" fill="rgba(130,10,209,0.2)" stroke="#820AD1" strokeWidth="1.5" />
      <text x="248" y="86" textAnchor="middle" fontSize="9" fill="#820AD1" fontWeight="700">IA</text>
      <text x="248" y="98" textAnchor="middle" fontSize="7" fill="#5a4a72">RDR</text>
    </svg>
    <div className="hc-theme-label">
      COMPSOL <span>RDR</span> &middot; IA Conectada
    </div>
  </div>
);

const ThemeMetrics = () => (
  <div className="hc-theme-center">
    <div className="hc-metrics-grid">
      <div className="hc-metric-card">
        <div className="hc-metric-val">~21<em>min</em></div>
        <div className="hc-metric-label">economizados<br />por dossiê</div>
      </div>
      <div className="hc-metric-card">
        <div className="hc-metric-val">94<em>/dia</em></div>
        <div className="hc-metric-label">dossiês<br />processados</div>
      </div>
      <div className="hc-metric-card">
        <div className="hc-metric-val">47</div>
        <div className="hc-metric-label">analistas<br />atendidos</div>
      </div>
      <div className="hc-metric-card">
        <div className="hc-metric-val">6.278</div>
        <div className="hc-metric-label">casos no<br />escopo 2024</div>
      </div>
    </div>
    <div className="hc-theme-label">
      COMPSOL <span>RDR</span> &middot; Squad BOAS
    </div>
  </div>
);
