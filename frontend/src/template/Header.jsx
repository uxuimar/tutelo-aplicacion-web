import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";
import logo from "../assets/logo.png";
import { useEffect, useRef, useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";

const USER_STORAGE_KEY = "tutelo_user"; // usuario

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdminAuthenticated } = useAdminAuth();

  const path = location.pathname || "/";
  const isAuthRoute = path === "/login" || path === "/register";
  const firstSegment = path.split("/")[1] || "";
  const isAdminRoute =
    firstSegment === "admin" || firstSegment === "administracion";

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [openUserMenu, setOpenUserMenu] = useState(false);
  const userMenuRef = useRef(null);

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
    window.dispatchEvent(new Event("auth_changed"));
    setUser(null);
    setOpenUserMenu(false);
    navigate("/");
  };

  const fullName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "";

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
        {/*
          CORRECCIÓN VERÓNICA - Punto 2: Problemas en autenticación
          El estado admin ya no depende de localStorage ni admin_basic,
          sino del contexto admin en memoria.
        */}
        {isAdminAuthenticated && !isAdminRoute && (
          <Link to="/administracion" className="admin-status-link">
            Volver al panel →
          </Link>
        )}

        {!isAdminRoute && !isAdminAuthenticated && !isAuthRoute && (
          <Link to="/administracion/login" className="btn btn--outline">
            Acceso administración
          </Link>
        )}

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
              <span className="user-chip__caret" aria-hidden="true">
                ▾
              </span>
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