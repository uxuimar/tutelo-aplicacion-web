import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import logo from "../assets/logo.png";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "admin_basic"; // administración
const USER_STORAGE_KEY = "tutelo_user"; // usuario

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  // Detectar si estamos en rutas admin
  const path = location.pathname || "/";
  const isAuthRoute = path === "/login" || path === "/register";
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

  // Sesión usuario (registro/login)
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Dropdown usuario
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Sync: si login/logout ocurre, reflejarlo en header sin recargar
  useEffect(() => {
    const syncUser = () => {
      try {
        const raw = localStorage.getItem(USER_STORAGE_KEY);
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener("auth_changed", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("auth_changed", syncUser);
    };
  }, []);

  // Cerrar dropdown al click afuera + ESC
  useEffect(() => {
    if (!openUserMenu) return;

    const onDown = (e) => {
      if (e.key === "Escape") setOpenUserMenu(false);
    };

    const onClick = (e) => {
      const el = userMenuRef.current;
      if (!el) return;
      if (!el.contains(e.target)) setOpenUserMenu(false);
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("mousedown", onClick);
    };
  }, [openUserMenu]);

  const logoutUser = () => {
    localStorage.removeItem(USER_STORAGE_KEY);

      // Notificar a toda la app que cambió el estado de autenticación
      window.dispatchEvent(new Event("auth_changed"));

    setUser(null);
    setOpenUserMenu(false);
    navigate("/");
  };

  const fullName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "";

  const getInitials = (u) => {
  const first = (u?.firstName || "").trim();
  const last = (u?.lastName || "").trim();
    return ((first[0] || "") + (last[0] || "")).toUpperCase() || "U";
  };

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
        {!isAdminRoute && !isAdmin && !isAuthRoute && (
          <Link to="/administracion" className="btn btn--outline">
            Administrar alojamientos
          </Link>
        )}

        {/* Usuario: si NO está logueado -> register/login (pero oculto en /login y /register) */}
        {!user && !isAuthRoute ? (
          <>
            <Link to="/register" className="btn btn--secondary">
              Crear cuenta
            </Link>

            <Link to="/login" className="btn btn--primary">
              Iniciar sesión
            </Link>
          </>
        ) : user ? (
          // Usuario logueado: dropdown (distinto al admin)
          <div className="user-menu" ref={userMenuRef}>
            <button
              type="button"
              className="user-chip"
              onClick={() => setOpenUserMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={openUserMenu}
            >
              <span className="user-avatar" aria-hidden="true">
                {getInitials(user)}
              </span>
              <span className="user-chip__name">{fullName || "Mi cuenta"}</span>
              <span className="user-chip__caret" aria-hidden="true">▾</span>
            </button>

            {openUserMenu && (
              <div className="user-dropdown" role="menu">
                <Link
                  to="/account"
                  className="user-dropdown__item"
                  role="menuitem"
                  onClick={() => setOpenUserMenu(false)}
                >
                  Mi cuenta
                </Link>

                <div className="user-dropdown__sep" />

                <button
                  type="button"
                  className="user-dropdown__item user-dropdown__item--danger"
                  role="menuitem"
                  onClick={logoutUser}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </header>
  );
}