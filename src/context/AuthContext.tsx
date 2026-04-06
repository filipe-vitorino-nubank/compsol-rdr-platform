import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  STORAGE_GOOGLE_TOKEN,
  STORAGE_GOOGLE_TOKEN_EXP,
  STORAGE_GOOGLE_USER,
} from "../lib/storageKeys";

export type GoogleUserProfile = {
  email: string;
  name?: string;
  picture?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (resp: {
              access_token?: string;
              expires_in?: number;
              error?: string;
            }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
          revoke: (token: string, done: () => void) => void;
        };
      };
    };
  }
}

type AuthContextValue = {
  token: string | null;
  tokenExpiresAt: number | null;
  /** Perfil da conta Google após login (email / nome / foto). */
  googleUser: GoogleUserProfile | null;
  scriptReady: boolean;
  /** Abre o fluxo OAuth do Google (mesmo botão para “Entrar” e renovar token). */
  signInWithGoogle: (opts?: { promptConsent?: boolean }) => void;
  requestAccessToken: () => void;
  getAccessTokenForSheets: (opts?: { interactive?: boolean }) => Promise<string>;
  /** Força popup de seleção de conta (prompt: select_account). */
  refreshLogin: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Sheets + identidade (para exibir quem está autenticado). */
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/cloud-platform",
  "openid",
  "email",
  "profile",
].join(" ");

function loadStoredToken(): { token: string; exp: number } | null {
  try {
    const t = localStorage.getItem(STORAGE_GOOGLE_TOKEN);
    const e = localStorage.getItem(STORAGE_GOOGLE_TOKEN_EXP);
    if (!t || !e) return null;
    const exp = parseInt(e, 10);
    if (Date.now() >= exp - 60_000) return null;
    return { token: t, exp };
  } catch {
    return null;
  }
}

function loadStoredProfile(): GoogleUserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_GOOGLE_USER);
    if (!raw) return null;
    const p = JSON.parse(raw) as GoogleUserProfile;
    if (p && typeof p.email === "string") return p;
    return null;
  } catch {
    return null;
  }
}

async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!data.email) return null;
  return { email: data.email, name: data.name, picture: data.picture };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [scriptReady, setScriptReady] = useState(false);
  const [token, setToken] = useState<string | null>(() => loadStoredToken()?.token ?? null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(
    () => loadStoredToken()?.exp ?? null
  );
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(() => {
    if (!loadStoredToken()) {
      localStorage.removeItem(STORAGE_GOOGLE_USER);
      return null;
    }
    return loadStoredProfile();
  });

  useEffect(() => {
    if (document.querySelector('script[data-gis="1"]')) {
      setScriptReady(!!window.google?.accounts);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.dataset.gis = "1";
    s.onload = () => setScriptReady(true);
    document.body.appendChild(s);
  }, []);

  const persistProfile = useCallback((p: GoogleUserProfile | null) => {
    if (p) {
      localStorage.setItem(STORAGE_GOOGLE_USER, JSON.stringify(p));
      setGoogleUser(p);
    } else {
      localStorage.removeItem(STORAGE_GOOGLE_USER);
      setGoogleUser(null);
    }
  }, []);

  const refreshProfile = useCallback(
    async (accessToken: string) => {
      const p = await fetchGoogleUserProfile(accessToken);
      if (p) persistProfile(p);
    },
    [persistProfile]
  );

  /** Token válido sem perfil salvo (ex.: primeiro acesso) — busca email no Google uma vez. */
  useEffect(() => {
    const t = loadStoredToken()?.token;
    if (!t) return;
    if (loadStoredProfile()) return;
    void refreshProfile(t);
  }, [refreshProfile]);

  const persistToken = useCallback(
    (accessToken: string, expiresIn: number) => {
      const exp = Date.now() + expiresIn * 1000;
      localStorage.setItem(STORAGE_GOOGLE_TOKEN, accessToken);
      localStorage.setItem(STORAGE_GOOGLE_TOKEN_EXP, String(exp));
      setToken(accessToken);
      setTokenExpiresAt(exp);
      void refreshProfile(accessToken);
    },
    [refreshProfile]
  );

  const signInWithGoogle = useCallback(
    (opts?: { promptConsent?: boolean }) => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error("Missing VITE_GOOGLE_CLIENT_ID");
        return;
      }
      if (!window.google?.accounts?.oauth2) return;

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) {
            console.error(resp);
            return;
          }
          if (resp.access_token && resp.expires_in) {
            persistToken(resp.access_token, resp.expires_in);
          }
        },
      });
      client.requestAccessToken({
        prompt: opts?.promptConsent ? "consent" : "",
      });
    },
    [persistToken]
  );

  const requestAccessToken = useCallback(() => {
    signInWithGoogle({ promptConsent: false });
  }, [signInWithGoogle]);

  const getAccessTokenForSheets = useCallback(
    async (opts?: { interactive?: boolean }) => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error(
          "Configure VITE_GOOGLE_CLIENT_ID no arquivo .env (veja .env.example)."
        );
      }
      if (!window.google?.accounts?.oauth2) {
        throw new Error("Script do Google Identity ainda não carregou. Tente novamente.");
      }
      const stored = loadStoredToken();
      if (stored && !opts?.interactive) {
        return stored.token;
      }
      return new Promise<string>((resolve, reject) => {
        const client = window.google!.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (resp) => {
            if (resp.error) {
              reject(new Error(resp.error));
              return;
            }
            if (resp.access_token && resp.expires_in) {
              persistToken(resp.access_token, resp.expires_in);
              resolve(resp.access_token);
            } else {
              reject(new Error("Token não retornado."));
            }
          },
        });
        client.requestAccessToken({
          prompt: opts?.interactive ? "consent" : "",
        });
      });
    },
    [persistToken]
  );

  const refreshLogin = useCallback(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.oauth2) return;

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error) { console.error("Refresh login failed:", resp.error); return; }
        if (resp.access_token && resp.expires_in) persistToken(resp.access_token, resp.expires_in);
      },
    });
    client.requestAccessToken({ prompt: "select_account" });
  }, [persistToken]);

  const signOut = useCallback(() => {
    const t = localStorage.getItem(STORAGE_GOOGLE_TOKEN);
    if (t && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(t, () => undefined);
      } catch {
        /* ignore */
      }
    }
    localStorage.removeItem(STORAGE_GOOGLE_TOKEN);
    localStorage.removeItem(STORAGE_GOOGLE_TOKEN_EXP);
    localStorage.removeItem(STORAGE_GOOGLE_USER);
    setToken(null);
    setTokenExpiresAt(null);
    setGoogleUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      tokenExpiresAt,
      googleUser,
      scriptReady,
      signInWithGoogle,
      requestAccessToken,
      getAccessTokenForSheets,
      refreshLogin,
      signOut,
    }),
    [
      token,
      tokenExpiresAt,
      googleUser,
      scriptReady,
      signInWithGoogle,
      requestAccessToken,
      getAccessTokenForSheets,
      refreshLogin,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
