import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { LanguageProvider } from "./context/LanguageContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";
import { FormProvider } from "./context/FormContext.tsx";
import { ModalProvider } from "./context/ModalContext.tsx";
import { ChatProvider } from "./context/ChatContext.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { validateEnv } from "./config/env.ts";

validateEnv();

/* eslint-disable @typescript-eslint/no-explicit-any */
console.log("[COMPSOL] APP_CONFIG:", {
  hasConfig: !!(window as any).__APP_CONFIG__,
  isGAS: !!(window as any).google?.script?.run,
  userEmail: (window as any).__APP_CONFIG__?.USER_EMAIL || "VAZIO",
  hasToken: !!((window as any).__APP_CONFIG__?.ACCESS_TOKEN),
  sheetId: (window as any).__APP_CONFIG__?.SHEET_ID || "VAZIO",
});
/* eslint-enable @typescript-eslint/no-explicit-any */

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ModalProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>
                <FormProvider>
                  <ChatProvider>
                    <App />
                  </ChatProvider>
                </FormProvider>
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ModalProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
