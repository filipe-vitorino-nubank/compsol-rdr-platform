import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/Layout/AppLayout";
import { Home } from "./pages/Home";
import { RdrRequestForm } from "./components/StepForm/StepForm";
import { DashboardPage } from "./pages/DashboardPage";
import { ConfigPage } from "./pages/ConfigPage";
import ChatWidget from "./components/chat/ChatWidget";

export default function App() {
  return (
    <>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/solicitacao" element={<RdrRequestForm />} />
            <Route path="/painel" element={<DashboardPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/dashboard" element={<Navigate to="/painel" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ChatWidget />
    </>
  );
}
