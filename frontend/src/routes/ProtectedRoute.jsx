import { LoaderCircle } from "lucide-react";
import { Navigate, useLocation } from "react-router";

import { useAuth } from "../context/AuthContext";

export function FullPageLoader({ label = "Chargement…" }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-gray-50" role="status">
      <div className="flex flex-col items-center gap-3 text-gray-500">
        <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden="true" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

/**
 * Réservé aux administrateurs connectés. La vraie protection est côté serveur
 * (401/403 sur /api/admin/) : ceci évite seulement d'afficher des pages vides.
 */
export default function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageLoader label="Vérification de la session…" />;
  if (status === "anonymous") return <Navigate to="/admin/login" replace state={{ from: location }} />;
  return children;
}
