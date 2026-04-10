import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAdminCheck } from "../hooks/useAdminCheck";
import { LoadingScreen } from "../components/ui/LoadingScreen";

function getMapaUrl(): string {
  const base = window.location.href.split("?")[0].split("#")[0];
  return `${base}?page=mapa`;
}

export function MapaPage() {
  const { isAdmin, isLoading } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin || isLoading) return;
    window.open(getMapaUrl(), "_blank");
    navigate(-1);
  }, [isAdmin, isLoading]);

  if (isLoading) return <LoadingScreen message="Verificando permissões..." fullScreen />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return null;
}
