import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminRoute({ children }) {
  const location = useLocation();
  const { isAdminAuthenticated, isAdminAuthorized } = useAdminAuth();

  /*
    CORRECCIÓN - Punto 2: Problemas en autenticación
    La sesión admin ya no se lee de localStorage/sessionStorage.
    Se valida desde el contexto en memoria.
  */
  if (!isAdminAuthenticated) {
    return (
      <Navigate
        to="/administracion/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (!isAdminAuthorized) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}