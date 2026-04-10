import { Navigate } from "react-router-dom";
import { useAdminCheck } from "../hooks/useAdminCheck";
import { LoadingScreen } from "../components/ui/LoadingScreen";

export function MapaPage() {
  const { isAdmin, isLoading } = useAdminCheck();

  if (isLoading) return <LoadingScreen message="Verificando permissões..." fullScreen />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div style={{ width: "100%", height: "calc(100vh - 48px)", overflow: "hidden" }}>
      <iframe
        src="/mapa-rdr.html"
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Mapa Neural COMPSOL RDR"
      />
    </div>
  );
}
