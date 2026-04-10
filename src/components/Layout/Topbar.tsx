import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

export function Topbar() {
  const { toggleTheme, isDark } = useTheme();
  const { googleUser } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-logo">
        <div className="logo-hex">
          <svg viewBox="0 0 32 32" fill="none" width="32" height="32">
            <polygon
              points="16,2 28,9 28,23 16,30 4,23 4,9"
              stroke="var(--purple-600)"
              strokeWidth="1"
              fill="var(--purple-dim)"
            />
            <polygon
              points="16,7 23,11 23,21 16,25 9,21 9,11"
              stroke="var(--purple-600)"
              strokeWidth="0.5"
              fill="rgba(130,10,209,0.05)"
            />
            <circle cx="16" cy="16" r="3" fill="var(--purple-600)" />
          </svg>
        </div>
        <div className="logo-text-wrap">
          <span className="logo-name">BOAS</span>
          <span className="logo-sub">Squad BOAS &middot; Nubank</span>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={isDark ? "Mudar para Light mode" : "Mudar para Dark mode"}
          type="button"
        >
          {isDark ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          <span>{isDark ? "Light" : "Dark"}</span>
        </button>

        {googleUser && (
          <div className="topbar-avatar" title={googleUser.email}>
            {googleUser.picture ? (
              <img
                src={googleUser.picture}
                alt={googleUser.name}
                className="topbar-avatar-img"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="topbar-avatar-initials">
                {googleUser.name?.slice(0, 2).toUpperCase() || "??"}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
