import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { LanguageProvider } from "./context/LanguageContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";
import { FormProvider } from "./context/FormContext.tsx";
import { ModalProvider } from "./context/ModalContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
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
  </StrictMode>
);
