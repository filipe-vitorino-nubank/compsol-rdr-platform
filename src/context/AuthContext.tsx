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
import { env } from "../config/env";

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
  const isGAS = env.isAppsScript;

  const [scriptReady, setScriptReady] = useState(isGAS);
  const [isAuthenticated, setIsAuthenticated] = useState(isGAS && !!env.accessToken);
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(
    isGAS && env.userEmail ? { email: env.userEmail, name: env.userEmail.split("@")[0] } : null,
  );
  const modal = useModal();

  const tokenRef = useRef<string | null>(isGAS ? env.accessToken : null);
  const tokenExpiresAtRef = useRef<number | null>(
    isGAS && env.tokenExp ? env.tokenExp : null,
  );
  const isRefreshingRef = useRef(false);
  const refreshPromiseRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    if (isGAS && env.userEmail) {
      setGoogleUser({
        email: env.userEmail,
        name: env.userName || env.userEmail.split("@")[0],
        picture: env.userPhoto || "",
      });
      tokenRef.current = env.accessToken;
      tokenExpiresAtRef.current = env.tokenExp;
      return;
    }

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
  }, [isGAS]);

  const clearAuth = useCallback(() => {
    tokenRef.current = null;
    tokenExpiresAtRef.current = null;
    setIsAuthenticated(false);
    setGoogleUser(null);
  }, []);

  const refreshProfile = useCallback(
    async (accessToken: string) => {
      if (isGAS) return;

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
    [clearAuth, modal, isGAS],
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
      if (isGAS) return;
      const clientId = env.googleClientId;
      if (!clientId) {
        console.error("Missing GOOGLE_CLIENT_ID");
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
    [persistToken, isGAS],
  );

  const requestAccessToken = useCallback(() => {
    signInWithGoogle({ promptConsent: false });
  }, [signInWithGoogle]);

  const getAccessTokenForSheets = useCallback(
    async (opts?: { interactive?: boolean }): Promise<string> => {
      if (isGAS && tokenRef.current) {
        return tokenRef.current;
      }

      const clientId = env.googleClientId;
      if (!clientId) {
        throw new Error(
          "Configure GOOGLE_CLIENT_ID nas Script Properties (ou .env para dev local).",
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
    [persistToken, isTokenExpired, isGAS],
  );

  const refreshLogin = useCallback(() => {
    if (isGAS) {
      modal.showModal({
        type: "info",
        title: "Token atualizado",
        message:
          "No Apps Script a autenticação é gerenciada automaticamente. " +
          "Recarregue a página se necessário.",
        confirmLabel: "Recarregar",
        onConfirm: () => {
          try {
            window.top?.location.reload();
          } catch {
            window.location.reload();
          }
        },
      });
      return;
    }
    const clientId = env.googleClientId;
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
  }, [persistToken, isGAS, modal]);

  const signOut = useCallback(() => {
    if (isGAS) {
      tokenRef.current = null;
      tokenExpiresAtRef.current = null;
      setIsAuthenticated(false);
      setGoogleUser(null);
      try {
        window.top?.location.replace("https://accounts.google.com/logout");
      } catch {
        modal.info(
          "Sair da conta",
          "Para sair, acesse myaccount.google.com e faça logout da sua conta Google.",
        );
      }
      return;
    }
    if (tokenRef.current && window.google?.accounts?.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(tokenRef.current, () => undefined);
      } catch {
        /* ignore */
      }
    }
    clearAuth();
  }, [clearAuth, isGAS, modal]);

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
