import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useModal } from "./ModalContext";

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
  isAuthenticated: boolean;
  googleUser: GoogleUserProfile | null;
  scriptReady: boolean;
  signInWithGoogle: (opts?: { promptConsent?: boolean }) => void;
  requestAccessToken: () => void;
  getAccessTokenForSheets: (opts?: { interactive?: boolean }) => Promise<string>;
  refreshLogin: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/cloud-platform",
  "openid",
  "email",
  "profile",
].join(" ");

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(null);
  const modal = useModal();

  const tokenRef = useRef<string | null>(null);
  const tokenExpiresAtRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<string> | null>(null);

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

  const clearAuth = useCallback(() => {
    tokenRef.current = null;
    tokenExpiresAtRef.current = null;
    setIsAuthenticated(false);
    setGoogleUser(null);
  }, []);

  const refreshProfile = useCallback(
    async (accessToken: string) => {
      const p = await fetchGoogleUserProfile(accessToken);
      if (!p) return;

      if (!p.email.endsWith("@nubank.com.br")) {
        clearAuth();
        modal.error(
          "Acesso restrito",
          "Esta plataforma é de uso exclusivo para colaboradores Nubank. " +
            "Por favor, faça login com sua conta @nubank.com.br.",
        );
        return;
      }

      setGoogleUser(p);
    },
    [clearAuth, modal],
  );

  const persistToken = useCallback(
    (accessToken: string, expiresIn: number) => {
      const exp = Date.now() + expiresIn * 1000;
      tokenRef.current = accessToken;
      tokenExpiresAtRef.current = exp;
      setIsAuthenticated(true);
      void refreshProfile(accessToken);
    },
    [refreshProfile],
  );

  const isTokenExpired = useCallback(() => {
    if (!tokenExpiresAtRef.current) return true;
    return Date.now() >= tokenExpiresAtRef.current;
  }, []);

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
            console.error("[Auth] Erro na resposta OAuth:", resp.error);
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
    [persistToken],
  );

  const requestAccessToken = useCallback(() => {
    signInWithGoogle({ promptConsent: false });
  }, [signInWithGoogle]);

  const getAccessTokenForSheets = useCallback(
    async (opts?: { interactive?: boolean }): Promise<string> => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error(
          "Configure VITE_GOOGLE_CLIENT_ID no arquivo .env (veja .env.example).",
        );
      }
      if (!window.google?.accounts?.oauth2) {
        throw new Error("Script do Google Identity ainda não carregou. Tente novamente.");
      }

      if (tokenRef.current && !isTokenExpired() && !opts?.interactive) {
        return tokenRef.current;
      }

      if (isRefreshingRef.current && refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }

      isRefreshingRef.current = true;
      refreshPromiseRef.current = new Promise<string>((resolve, reject) => {
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
      }).finally(() => {
        isRefreshingRef.current = false;
        refreshPromiseRef.current = null;
      });

      return refreshPromiseRef.current;
    },
    [persistToken, isTokenExpired],
  );

  const refreshLogin = useCallback(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google?.accounts?.oauth2) return;

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error) {
          console.error("Refresh login failed:", resp.error);
          return;
        }
        if (resp.access_token && resp.expires_in) persistToken(resp.access_token, resp.expires_in);
      },
    });
    client.requestAccessToken({ prompt: "select_account" });
  }, [persistToken]);

  const signOut = useCallback(() => {
    if (tokenRef.current && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(tokenRef.current, () => undefined);
      } catch {
        /* ignore */
      }
    }
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      googleUser,
      scriptReady,
      signInWithGoogle,
      requestAccessToken,
      getAccessTokenForSheets,
      refreshLogin,
      signOut,
    }),
    [
      isAuthenticated,
      googleUser,
      scriptReady,
      signInWithGoogle,
      requestAccessToken,
      getAccessTokenForSheets,
      refreshLogin,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
