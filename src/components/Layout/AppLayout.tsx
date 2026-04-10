import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { env } from "../../config/env";
import type { Locale } from "../../i18n/translations";
import { Topbar } from "./Topbar";
import { ProfileDrawer } from "../Profile/ProfileDrawer";
import { TeamDrawer } from "../team/TeamDrawer";
import { LoadingScreen } from "../ui/LoadingScreen";

const LANG_LABEL: Record<Locale, string> = { "pt-BR": "PT", en: "EN", es: "ES" };

function getInitials(name: string | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SidebarTooltip({ label }: { label: string }) {
  return <div className="sidebar-tooltip">{label}</div>;
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [teamDrawerOpen, setTeamDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const {
    googleUser,
    isAuthenticated,
    scriptReady,
    signInWithGoogle,
    refreshLogin,
    signOut,
  } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const { isDark } = useTheme();
  const clientConfigured = Boolean(env.googleClientId);

  if (!scriptReady && !env.isAppsScript) {
    return <LoadingScreen message="Iniciando plataforma..." fullScreen />;
  }

  const handleTriggerClick = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 220;

      let top: number;
      let left: number;

      if (!sidebarOpen) {
        left = rect.right + 8;
        const spaceBelow = window.innerHeight - rect.top;
        if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
          top = rect.bottom - dropdownHeight;
        } else {
          top = rect.top;
        }
      } else {
        left = rect.left;
        top = rect.top - dropdownHeight - 8;
        if (top < 8) top = 8;
      }

      setDropdownPos({ top, left });
    }
    setMenuOpen((v) => !v);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        !target.closest(".profile-dropdown-portal")
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const location = useLocation();
  const isFullWidth = location.pathname === "/" || location.pathname === "/painel";

  const NAV_ICONS: Record<string, string> = {
    "/": "🏠",
    "/solicitacao": "📝",
    "/painel": "📊",
    "/config": "⚙️",
  };

  const nav = [
    { to: "/", label: t("nav.home") || "Início", end: true },
    { to: "/solicitacao", label: t("nav.newRequest"), end: true },
    { to: "/painel", label: t("nav.dashboard") },
    { to: "/config", label: t("nav.settings") },
  ];

  const displayName = googleUser?.name ?? googleUser?.email ?? "—";

  const dropdownContent = (
    <>
      <button
        type="button"
        className="profile-dropdown-action"
        onClick={() => { setProfileDrawerOpen(true); setMenuOpen(false); }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        {t("nav.profile")}
      </button>

      <div className="profile-dropdown-divider" />

      <div className="profile-dropdown-lang-row">
        <span className="profile-dropdown-label">{t("lang.label")}</span>
        <div className="profile-dropdown-lang-btns">
          {(["pt-BR", "en", "es"] as Locale[]).map((l) => (
            <button
              key={l}
              type="button"
              className={`profile-lang-btn ${locale === l ? "active" : ""}`}
              onClick={() => { setLocale(l); setMenuOpen(false); }}
            >
              {LANG_LABEL[l]}
            </button>
          ))}
        </div>
      </div>

      <div className="profile-dropdown-divider" />

      <button type="button" className="profile-dropdown-action" onClick={() => { refreshLogin(); setMenuOpen(false); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        {t("auth.refreshLogin")}
      </button>

      <button type="button" className="profile-dropdown-action" onClick={() => { signOut(); setMenuOpen(false); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        {t("auth.signOut")}
      </button>
    </>
  );

  return (
    <div className="app-shell" data-theme={isDark ? "dark" : "light"}>
      <Topbar />
      <a
        href="#conteudo-principal"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById("conteudo-principal");
          el?.focus({ preventScroll: true });
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        {t("nav.skipToContent")}
      </a>

      <div className="app-body">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="sidebar-scope z-20 flex flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] shadow-[4px_0_24px_-8px_rgba(0,0,0,0.3)]"
        aria-label={t("nav.mainNav")}
      >
        {/* Floating toggle */}
        <button
          type="button"
          className="sidebar-float-toggle"
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? "Recolher menu" : "Expandir menu"}
        >
          <svg
            viewBox="64 64 896 896"
            width="13"
            height="13"
            fill="currentColor"
            style={{
              transform: sidebarOpen ? "none" : "scaleX(-1)",
              transition: "transform 0.2s ease",
            }}
          >
            <path d="M408 442h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm-8 204c0 4.4 3.6 8 8 8h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56zm504-486H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 632H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM115.4 518.9L271.7 642c5.8 4.6 14.4.5 14.4-6.9V388.9c0-7.4-8.5-11.5-14.4-6.9L115.4 505.1a8.74 8.74 0 000 13.8z" />
          </svg>
        </button>

        {/* Header */}
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--sidebar-border)] px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--purple-700)] text-xs font-bold text-white">
            C
          </div>
          {sidebarOpen ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--sidebar-text)]">COMPSOL</p>
                <p className="truncate text-[11px] text-[var(--sidebar-text-muted)]">NuStage Hub</p>
              </div>
              <button
                type="button"
                className="sidebar-toggle-btn"
                onClick={() => setSidebarOpen(false)}
                title="Recolher menu"
                style={{ marginTop: 2 }}
              >
                <svg viewBox="64 64 896 896" width="13" height="13" fill="currentColor">
                  <path d="M408 442h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm-8 204c0 4.4 3.6 8 8 8h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56zm504-486H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 632H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM115.4 518.9L271.7 642c5.8 4.6 14.4.5 14.4-6.9V388.9c0-7.4-8.5-11.5-14.4-6.9L115.4 505.1a8.74 8.74 0 000 13.8z" />
                </svg>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(true)}
                title="Expandir menu"
              style={{ margin: "0 auto" }}
            >
              <svg viewBox="64 64 896 896" width="13" height="13" fill="currentColor" style={{ transform: "scaleX(-1)" }}>
                <path d="M408 442h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8zm-8 204c0 4.4 3.6 8 8 8h480c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H408c-4.4 0-8 3.6-8 8v56zm504-486H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zm0 632H120c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM115.4 518.9L271.7 642c5.8 4.6 14.4.5 14.4-6.9V388.9c0-7.4-8.5-11.5-14.4-6.9L115.4 505.1a8.74 8.74 0 000 13.8z" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden p-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative rounded-[var(--radius-input)] px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--purple-700)] ${
                  isActive
                    ? "bg-[var(--sidebar-hover)] text-[var(--sidebar-text)] shadow-[inset_3px_0_0_var(--purple-700)]"
                    : "text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
                } ${sidebarOpen ? "" : "nav-item-collapsed flex justify-center px-2"}`
              }
            >
              {sidebarOpen ? item.label : (NAV_ICONS[item.to] || item.label.charAt(0))}
              {!sidebarOpen && <SidebarTooltip label={item.label} />}
            </NavLink>
          ))}

          {/* Equipe */}
          {sidebarOpen ? (
            <button
              type="button"
              className="sidebar-nav-btn relative rounded-[var(--radius-input)] px-3 py-2.5 text-sm font-medium text-[var(--sidebar-text-muted)] transition-all hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
              onClick={() => setTeamDrawerOpen(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Equipe</span>
              <svg style={{ marginLeft: "auto", opacity: 0.4 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              className="nav-item-collapsed relative rounded-[var(--radius-input)] px-2 py-2.5 text-sm font-medium text-[var(--sidebar-text-muted)] transition-all hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)] flex justify-center"
              onClick={() => setTeamDrawerOpen(true)}
            >
              <div style={{ background: "rgba(55,138,221,0.15)", borderRadius: 10, padding: 7, color: "#378ADD" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <SidebarTooltip label="Equipe" />
            </button>
          )}
        </nav>

        {/* Bottom area */}
        <div className="shrink-0 border-t border-[var(--sidebar-border)] p-2">
          {isAuthenticated && googleUser ? (
            <div className="profile-menu-wrapper" ref={menuRef}>
              {/* Dropdown — always via portal for reliable positioning */}
              {menuOpen && createPortal(
                <div
                  className="profile-dropdown profile-dropdown-portal"
                  style={{
                    position: "fixed",
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    bottom: "auto",
                    right: "auto",
                    minWidth: 200,
                    width: sidebarOpen ? 244 : 220,
                    zIndex: 9999,
                  }}
                >
                  {dropdownContent}
                </div>,
                document.body,
              )}

              {/* Profile trigger */}
              <div className={sidebarOpen ? "" : "nav-item-collapsed relative"}>
                <button
                  ref={triggerRef}
                  type="button"
                  className="profile-trigger"
                  onClick={handleTriggerClick}
                >
                  <div className="profile-trigger-avatar">
                    {googleUser.picture ? (
                      <img src={googleUser.picture} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <span>{getInitials(googleUser.name)}</span>
                    )}
                  </div>
                  {sidebarOpen && (
                    <>
                      <span className="profile-trigger-name">{displayName}</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                        className="profile-trigger-chevron"
                        style={{ transform: menuOpen ? "rotate(180deg)" : "none" }}
                      >
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </>
                  )}
                </button>
                {!sidebarOpen && !menuOpen && <SidebarTooltip label={displayName} />}
              </div>
            </div>
          ) : isAuthenticated && !googleUser ? (
            <div className="mb-2 rounded-lg border border-[var(--sidebar-border)] bg-[rgba(255,255,255,0.04)] px-2 py-3 text-center">
              <LoadingScreen message={t("auth.loadingAccount")} />
              {sidebarOpen ? (
                <button type="button" onClick={signOut} className="mt-2 text-[11px] text-[var(--sidebar-text-muted)] underline hover:text-[var(--sidebar-text)]">
                  {t("auth.cancel")}
                </button>
              ) : null}
            </div>
          ) : sidebarOpen ? (
            <button
              type="button"
              disabled={!scriptReady || !clientConfigured}
              onClick={() => signInWithGoogle({ promptConsent: true })}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--sidebar-border)] bg-white py-2 text-xs font-medium text-zinc-900 shadow-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t("auth.signIn")}
            </button>
          ) : (
            <button
              type="button"
              title={t("auth.signIn")}
              disabled={!scriptReady || !clientConfigured}
              onClick={() => signInWithGoogle({ promptConsent: true })}
              className="mb-2 flex w-full justify-center rounded-lg border border-[var(--sidebar-border)] bg-white p-2 text-zinc-900 hover:bg-zinc-100 disabled:opacity-50"
            >
              G
            </button>
          )}
        </div>

      </motion.aside>

      <motion.main
        id="conteudo-principal"
        tabIndex={-1}
        initial={false}
        animate={{ marginLeft: sidebarOpen ? 260 : 72 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="min-h-screen overflow-auto bg-[var(--bg-primary)] outline-none"
        style={{ transition: "background var(--transition-slow)" }}
      >
        {isFullWidth ? (
          <Outlet />
        ) : (
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
            <Outlet />
          </div>
        )}
      </motion.main>
      </div>

      <ProfileDrawer open={profileDrawerOpen} onClose={() => setProfileDrawerOpen(false)} />
      <TeamDrawer open={teamDrawerOpen} onClose={() => setTeamDrawerOpen(false)} />
    </div>
  );
}
