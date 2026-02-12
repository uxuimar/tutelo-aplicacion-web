import { Link, useLocation } from "react-router-dom";
import "./Header.css";
import logo from "../assets/logo.png";

const STORAGE_KEY = "admin_basic";

export default function Header() {
  const location = useLocation();

  // Detectar si estamos en rutas admin (sin falsos positivos)
  const path = location.pathname || "/";
  const firstSegment = path.split("/")[1] || "";
  const isAdminRoute = firstSegment === "admin" || firstSegment === "administracion";

  // Sesión admin (según tu sistema actual)
  let isAdmin = false;
  let adminUser = null;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const s = JSON.parse(saved);
      if (s?.user && s?.pass) {
        isAdmin = true;
        adminUser = s.user;
      }
    }
  } catch {}

  return (
    <header className="app-header">
      <div className="app-header__left">
        <Link to="/" className="app-header__brand">
          <img src={logo} alt="Tuteloh" className="app-header__logo" />
        </Link>
        <div className="app-header__subtitle">Hospedajes y Hoteles</div>
      </div>

      <div className="app-header__right">
        {/* Indicador clickeable para volver a admin cuando hay sesión */}
        {isAdmin && !isAdminRoute && (
          <Link to="/administracion" className="admin-status-link">
            Volver al panel →
          </Link>
        )}

        {/* CTA ADMIN (solo fuera de admin) */}
        {!isAdminRoute && !isAdmin && (
          <Link to="/administracion" className="btn btn--outline">
            Administrar alojamientos
          </Link>
        )}

        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => alert("Sin funcionalidad por ahora (según criterios).")}
        >
          Crear cuenta
        </button>

        <button
          type="button"
          className="btn btn--primary"
          onClick={() => alert("Sin funcionalidad por ahora (según criterios).")}
        >
          Iniciar sesión
        </button>
      </div>
    </header>
  );
}


