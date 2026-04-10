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
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { validateEnv } from "./config/env.ts";

validateEnv();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ModalProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>
                <FormProvider>
                  <App />
                </FormProvider>
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ModalProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
