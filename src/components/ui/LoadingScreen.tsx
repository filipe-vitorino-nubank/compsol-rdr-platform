interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  message = "Carregando...",
  fullScreen = false,
}: LoadingScreenProps) {
  return (
    <div
      className="loading-screen"
      style={{
        position: fullScreen ? "fixed" : "relative",
        inset: fullScreen ? 0 : "auto",
        width: "100%",
        height: fullScreen ? "100vh" : "100%",
        minHeight: fullScreen ? "100vh" : "400px",
        zIndex: fullScreen ? 9999 : "auto",
      }}
    >
      <div className="loading-content">
        <div className="loading-logo">
          <svg viewBox="0 0 48 48" fill="none" width="56" height="56">
            <polygon
              points="24,3 42,13 42,35 24,45 6,35 6,13"
              stroke="var(--purple-600, #820AD1)"
                    strokeWidth="1.5"
                    fill="var(--purple-dim, rgba(130,10,209,0.08))"
                    className="loading-hex-outer"
                  />
                  <polygon
                    points="24,10 36,17 36,31 24,38 12,31 12,17"
                    stroke="var(--purple-600, #820AD1)"
                    strokeWidth="0.8"
                    fill="rgba(130,10,209,0.05)"
                    className="loading-hex-inner"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="4"
                    fill="var(--purple-600, #820AD1)"
              className="loading-dot"
            />
          </svg>
        </div>

        <div className="loading-bar">
          <div className="loading-bar-fill" />
        </div>

        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
}
