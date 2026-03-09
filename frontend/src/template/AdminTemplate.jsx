import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "./Header";
import "./admin-template.css";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminTemplate({ children }) {
  const navigate = useNavigate();
  const { adminProfile, isAdminAuthenticated, logoutAdmin } = useAdminAuth();

  const isMobile = useMemo(
    () => window.matchMedia("(max-width: 768px)").matches,
    []
  );

  const profile = adminProfile || null;

  const readBool = (v) => v === true || v === "true" || v === 1 || v === "1";

  const isAdmin =
    readBool(profile?.isAdmin) ||
    readBool(profile?.IS_ADMIN) ||
    readBool(profile?.is_admin) ||
    profile?.roles?.includes?.("ROLE_ADMIN");

  const isSuperAdmin =
    readBool(profile?.isSuperAdmin) ||
    readBool(profile?.IS_SUPER_ADMIN) ||
    readBool(profile?.is_super_admin) ||
    profile?.roles?.includes?.("ROLE_SUPER_ADMIN");

  const canEdit = isAdmin || isSuperAdmin;

  const logout = () => {
    /*
      CORRECCIÓN VERÓNICA - Punto 2: Problemas en autenticación
      El cierre del panel limpia la sesión admin en memoria.
    */
    logoutAdmin();
    navigate("/administracion/login", { replace: true });
  };

  if (isMobile) {
    return (
      <div className="admin-template">
        <Header />
        <main className="admin-main" style={{ padding: 24 }}>
          <Link
            to="/"
            className="btn btn--outline"
            style={{ marginBottom: 12 }}
          >
            ← Ir a inicio
          </Link>

          <h2>Administración</h2>
          <p>
            El panel de administración no está disponible en dispositivos
            móviles.
          </p>
        </main>
      </div>
    );
  }

  if (!isAdminAuthenticated || !canEdit) return null;

  return (
    <div className="admin-template admin-layout">
      <Header />

      <div className="admin-topbar">
        <div className="admin-topbar__left">
          <Link to="/" className="btn btn--outline">
            ← Ir a inicio
          </Link>
        </div>

        <div className="admin-topbar__right">
          <div className="admin-welcome">
            Bienvenido, <b>{profile?.email}</b>

            <span
              className={`role-badge ${
                isSuperAdmin
                  ? "role-super"
                  : isAdmin
                  ? "role-admin"
                  : "role-guest"
              }`}
            >
              {isSuperAdmin
                ? "Propietario"
                : isAdmin
                ? "Administrador"
                : "Invitado"}
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="btn btn--secondary"
          >
            Cerrar panel
          </button>
        </div>
      </div>

      <main className="admin-main">
        {profile &&
          children &&
          React.cloneElement(children, { isAdmin, isSuperAdmin, canEdit })}
      </main>
    </div>
  );
}