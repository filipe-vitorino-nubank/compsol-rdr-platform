import { useState, useEffect } from "react";

const THEMES = ["gear", "neural", "cycle", "minimal"] as const;
type Theme = (typeof THEMES)[number];

function HeroGear() {
  return (
    <div className="hero-theme hero-gear">
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ animation: "gearSpin 12s linear infinite" }}>
        <g transform="translate(60,60)">
          <circle r="22" fill="rgba(130,10,209,0.12)" stroke="#820AD1" strokeWidth="0.5" />
          <circle r="12" fill="rgba(130,10,209,0.08)" stroke="#820AD1" strokeWidth="0.5" />
          <circle r="5" fill="#820AD1" />
          <g stroke="#820AD1" strokeWidth="4" strokeLinecap="round">
            <line x1="0" y1="-30" x2="0" y2="-40" />
            <line x1="0" y1="30" x2="0" y2="40" />
            <line x1="-30" y1="0" x2="-40" y2="0" />
            <line x1="30" y1="0" x2="40" y2="0" />
            <line x1="-21" y1="-21" x2="-28" y2="-28" />
            <line x1="21" y1="21" x2="28" y2="28" />
            <line x1="21" y1="-21" x2="28" y2="-28" />
            <line x1="-21" y1="21" x2="-28" y2="28" />
          </g>
          <circle r="42" fill="none" stroke="rgba(130,10,209,0.12)" strokeWidth="0.5" strokeDasharray="6 6" />
        </g>
      </svg>
      <div className="hero-theme-text">
        <div className="hero-theme-title">BOAS <span>RDR</span></div>
        <div className="hero-theme-sub">Automação · Squad BOAS</div>
        <div className="hero-theme-badges">
          <span>UiPath RPA</span>
          <span>Google Drive</span>
          <span>BACEN</span>
        </div>
      </div>
    </div>
  );
}

function HeroNeural() {
  return (
    <div className="hero-theme hero-neural">
      <svg width="200" height="100" viewBox="0 0 200 100">
        <line x1="20" y1="50" x2="60" y2="20" stroke="rgba(130,10,209,0.3)" strokeWidth="0.5" />
        <line x1="20" y1="50" x2="60" y2="80" stroke="rgba(130,10,209,0.3)" strokeWidth="0.5" />
        <line x1="60" y1="20" x2="100" y2="50" stroke="rgba(130,10,209,0.4)" strokeWidth="0.5" />
        <line x1="60" y1="80" x2="100" y2="50" stroke="rgba(130,10,209,0.4)" strokeWidth="0.5" />
        <line x1="100" y1="50" x2="140" y2="25" stroke="rgba(130,10,209,0.3)" strokeWidth="0.5" />
        <line x1="100" y1="50" x2="140" y2="75" stroke="rgba(130,10,209,0.3)" strokeWidth="0.5" />
        <line x1="140" y1="25" x2="180" y2="50" stroke="#820AD1" strokeWidth="1" />
        <line x1="140" y1="75" x2="180" y2="50" stroke="#820AD1" strokeWidth="1" />
        <circle cx="20" cy="50" r="8" fill="rgba(130,10,209,0.15)" stroke="#820AD1" strokeWidth="0.5" />
        <circle cx="60" cy="20" r="6" fill="rgba(130,10,209,0.12)" stroke="#820AD1" strokeWidth="0.5" />
        <circle cx="60" cy="80" r="6" fill="rgba(130,10,209,0.12)" stroke="#820AD1" strokeWidth="0.5" />
        <circle cx="100" cy="50" r="7" fill="rgba(130,10,209,0.15)" stroke="#820AD1" strokeWidth="0.5" />
        <circle cx="140" cy="25" r="5" fill="rgba(130,10,209,0.12)" stroke="#820AD1" strokeWidth="0.5" />
        <circle cx="140" cy="75" r="5" fill="rgba(130,10,209,0.12)" stroke="#820AD1" strokeWidth="0.5" />
        <circle cx="180" cy="50" r="10" fill="rgba(130,10,209,0.2)" stroke="#820AD1" strokeWidth="1" />
        <text x="180" y="54" textAnchor="middle" fontSize="8" fill="#820AD1" fontWeight="700">IA</text>
      </svg>
      <div className="hero-theme-text">
        <div className="hero-theme-title">BOAS <span>RDR</span></div>
        <div className="hero-theme-sub">IA conectando sistemas · Squad BOAS</div>
      </div>
    </div>
  );
}

function HeroCycle() {
  return (
    <div className="hero-theme hero-cycle">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(130,10,209,0.15)" strokeWidth="8" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#820AD1" strokeWidth="2" strokeDasharray="80 160" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="-90 50 50" to="270 50 50" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="50" cy="50" r="22" fill="rgba(130,10,209,0.06)" stroke="rgba(130,10,209,0.3)" strokeWidth="0.5" />
        <text x="50" y="47" textAnchor="middle" fontSize="9" fill="#820AD1" fontWeight="700">RDR</text>
        <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#5a4a72">automação</text>
        <circle cx="50" cy="12" r="5" fill="#820AD1" />
        <circle cx="88" cy="50" r="4" fill="rgba(130,10,209,0.5)" />
        <circle cx="50" cy="88" r="4" fill="rgba(130,10,209,0.5)" />
        <circle cx="12" cy="50" r="4" fill="rgba(130,10,209,0.5)" />
      </svg>
      <div className="hero-theme-text">
        <div className="hero-theme-title">BOAS <span>RDR</span></div>
        <div className="hero-theme-steps">
          <div><span>→</span> Analista solicita</div>
          <div><span>→</span> UiPath captura</div>
          <div><span>→</span> Dossiê gerado</div>
          <div><span>→</span> Drive + BACEN</div>
        </div>
      </div>
    </div>
  );
}

function HeroMinimal() {
  return (
    <div className="hero-theme hero-minimal">
      <div className="hero-theme-eyebrow">
        <div className="hero-eyebrow-dot" />
        Squad BOAS · Área do Produto
      </div>
      <div className="hero-theme-title large">BOAS <span>RDR</span></div>
      <div className="hero-minimal-stats">
        <div className="hero-stat">
          <span className="hero-stat-val">~21<em>min</em></span>
          <span className="hero-stat-label">economizados por dossiê</span>
        </div>
        <div className="hero-stat-divider" />
        <div className="hero-stat">
          <span className="hero-stat-val">94<em>/dia</em></span>
          <span className="hero-stat-label">dossiês processados</span>
        </div>
        <div className="hero-stat-divider" />
        <div className="hero-stat">
          <span className="hero-stat-val">47</span>
          <span className="hero-stat-label">analistas atendidos</span>
        </div>
      </div>
    </div>
  );
}

export function HeroCarousel() {
  const [current, setCurrent] = useState<Theme>("gear");
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => {
          const idx = THEMES.indexOf(prev);
          return THEMES[(idx + 1) % THEMES.length];
        });
        setFading(false);
      }, 400);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const goTo = (t: Theme) => {
    if (t === current) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(t);
      setFading(false);
    }, 400);
  };

  return (
    <div className="hero-carousel" style={{ opacity: fading ? 0 : 1, transition: "opacity 0.4s ease" }}>
      {current === "gear" && <HeroGear />}
      {current === "neural" && <HeroNeural />}
      {current === "cycle" && <HeroCycle />}
      {current === "minimal" && <HeroMinimal />}

      <div className="carousel-dots">
        {THEMES.map((t) => (
          <button key={t} className={`carousel-dot ${current === t ? "active" : ""}`} onClick={() => goTo(t)} />
        ))}
      </div>
    </div>
  );
}
