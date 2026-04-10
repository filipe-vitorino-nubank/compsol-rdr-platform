import { useState, useEffect, useCallback } from "react";

const THEMES = ["gear", "neural", "cycle", "minimal"] as const;
type Theme = (typeof THEMES)[number];

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function NeuralIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple-600)" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <line x1="8.5" y1="11" x2="15.5" y2="7" />
      <line x1="8.5" y1="13" x2="15.5" y2="17" />
    </svg>
  );
}

function CycleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
    </svg>
  );
}

function HexIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple-600)" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  );
}

const THEME_DATA: Record<Theme, { icon: JSX.Element; sub: string }> = {
  gear:    { icon: <GearIcon />,   sub: "Automação RPA · Squad BOAS" },
  neural:  { icon: <NeuralIcon />, sub: "IA conectando sistemas" },
  cycle:   { icon: <CycleIcon />,  sub: "Ciclo automatizado BACEN" },
  minimal: { icon: <HexIcon />,    sub: "Squad BOAS · Nubank" },
};

export function HeroCarousel() {
  const [current, setCurrent] = useState<Theme>("gear");
  const [fading, setFading] = useState(false);

  const goTo = useCallback((t: Theme) => {
    if (t === current || fading) return;
    setFading(true);
    setTimeout(() => { setCurrent(t); setFading(false); }, 350);
  }, [current, fading]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => {
          const idx = THEMES.indexOf(prev);
          return THEMES[(idx + 1) % THEMES.length];
        });
        setFading(false);
      }, 350);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const d = THEME_DATA[current];

  return (
    <div className="hero-carousel-strip" style={{ opacity: fading ? 0 : 1 }}>
      <div className="hcs-icon">{d.icon}</div>
      <div className="hcs-text">
        <div className="hcs-title">BOAS <span>RDR</span></div>
        <div className="hcs-sub">{d.sub}</div>
      </div>
      <div className="hcs-dots">
        {THEMES.map((t) => (
          <div key={t} className={`hcs-dot ${current === t ? "active" : ""}`} onClick={() => goTo(t)} />
        ))}
      </div>
    </div>
  );
}
