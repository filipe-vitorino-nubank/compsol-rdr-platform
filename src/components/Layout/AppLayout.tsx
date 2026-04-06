import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import type { Locale } from "../../i18n/translations";
import { ProfileDrawer } from "../Profile/ProfileDrawer";

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

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    googleUser,
    token,
    scriptReady,
    signInWithGoogle,
    refreshLogin,
    signOut,
  } = useAuth();
  const { t, locale, setLocale } = useLanguage();
  const clientConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const nav = [
    { to: "/", label: t("nav.newRequest"), end: true },
    { to: "/dashboard", label: t("nav.dashboard") },
    { to: "/config", label: t("nav.settings") },
  ];

  const displayName = googleUser?.name ?? googleUser?.email ?? "—";

  return (
    <div className="flex min-h-screen">
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

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="sidebar-scope relative z-20 flex shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] shadow-[4px_0_24px_-8px_rgba(0,0,0,0.3)]"
        aria-label={t("nav.mainNav")}
      >
        <div className="flex h-16 items-center gap-2 border-b border-[var(--sidebar-border)] px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--purple-700)] text-xs font-bold text-white">
            C
          </div>
          {sidebarOpen ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--sidebar-text)]">COMPSOL</p>
              <p className="truncate text-[11px] text-[var(--sidebar-text-muted)]">NuStage Hub</p>
            </div>
          ) : null}
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-[var(--radius-input)] px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--purple-700)] ${
                  isActive
                    ? "bg-[var(--sidebar-hover)] text-[var(--sidebar-text)] shadow-[inset_3px_0_0_var(--purple-700)]"
                    : "text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
                } ${sidebarOpen ? "" : "flex justify-center px-2"}`
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              {sidebarOpen ? item.label : item.label.charAt(0)}
            </NavLink>
          ))}
        </nav>

        {/* Bottom area */}
        <div className="border-t border-[var(--sidebar-border)] p-2">
          {token && googleUser ? (
            <div className="profile-menu-wrapper" ref={menuRef}>
              {/* Dropdown — above trigger */}
              {menuOpen && sidebarOpen && (
                <div className="profile-dropdown">
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
                </div>
              )}

              {/* Trigger */}
              <button
                type="button"
                className="profile-trigger"
                onClick={() => setMenuOpen((v) => !v)}
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
            </div>
          ) : token && !googleUser ? (
            <div className="mb-2 rounded-lg border border-[var(--sidebar-border)] bg-[rgba(255,255,255,0.04)] px-2 py-3 text-center">
              <p className="text-[11px] text-[var(--sidebar-text-muted)]">{t("auth.loadingAccount")}</p>
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

        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="m-2 rounded-lg border border-[var(--sidebar-border)] bg-[rgba(255,255,255,0.04)] py-2 text-xs text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)]"
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? t("nav.collapse") : "»"}
        </button>
      </motion.aside>

      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="min-w-0 flex-1 overflow-auto bg-[var(--color-bg)] outline-none"
      >
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
          <Outlet />
        </div>
      </main>

      <ProfileDrawer open={profileDrawerOpen} onClose={() => setProfileDrawerOpen(false)} />
    </div>
  );
}
