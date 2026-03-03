import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "./Header";
import "./admin-template.css";

const STORAGE_KEY = "admin_basic";

export default function AdminTemplate({ children }) {
  const navigate = useNavigate();

  const isMobile = useMemo(
    () => window.matchMedia("(max-width: 768px)").matches,
    []
  );

  // ================= SESSION =================
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [draft, setDraft] = useState({ user: "", pass: "" });
  const [profile, setProfile] = useState(null);

  const isLogged = Boolean(session?.user && session?.pass);

  // ================= ROLE CHECK =================
  // Soporta tanto flags booleanos (isAdmin/isSuperAdmin o IS_ADMIN/IS_SUPER_ADMIN)
  // como roles estilo Spring (ROLE_ADMIN / ROLE_SUPER_ADMIN)
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

  // Puede editar si es Admin o SuperAdmin
  const canEdit = isAdmin || isSuperAdmin;

  // ================= LOGIN =================
  const saveLogin = async (e) => {
    e.preventDefault();

    const user = draft.user.trim();
    const pass = draft.pass.trim();
    if (!user || !pass) return;

    try {
      const res = await fetch("http://localhost:8080/api/me", {
        headers: {
          Authorization: "Basic " + btoa(user + ":" + pass),
        },
      });

      if (!res.ok) {
        alert("Credenciales inválidas.");
        return;
      }

      const data = await res.json();

      const nextSession = { user, pass };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setProfile(data);

      navigate("/administracion");
    } catch (err) {
      console.error(err);
      alert("Error conectando con el servidor.");
    }
  };

  // ================= LOAD PROFILE =================
  useEffect(() => {
    if (!isLogged) return;

    const loadProfile = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/me", {
          headers: {
            Authorization:
              "Basic " + btoa(session.user + ":" + session.pass),
          },
        });

        if (!res.ok) {
          logout();
          return;
        }

        const data = await res.json();
        setProfile(data);
      } catch {
        logout();
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLogged]);

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setProfile(null);
    setDraft({ user: "", pass: "" });
    navigate("/administracion");
  };

  // ================= MOBILE =================
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

  // ================= LOGIN SCREEN =================
  if (!isLogged) {
    return (
      <div className="admin-color">
        <Header />

        <div className="admin-topbar">
          <div className="admin-topbar__left">
            <Link to="/" className="btn btn--outline">
              ← Ir a inicio
            </Link>
          </div>
        </div>

        <main
          className="admin-main"
          style={{ padding: 24, maxWidth: 520 }}
        >
          <h2>Ingresar a Administración</h2>

          <form
            onSubmit={saveLogin}
            style={{ display: "grid", gap: 12, marginTop: 12 }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span>Usuario</span>
              <input
                value={draft.user}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, user: e.target.value }))
                }
                style={input}
                placeholder="Escribe tu usuario"
                autoComplete="username"
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>Password</span>
              <input
                type="password"
                value={draft.pass}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, pass: e.target.value }))
                }
                style={input}
                placeholder="Escriba su contraseña"
                autoComplete="current-password"
              />
            </label>

            <button type="submit" className="btn btn--primary">
              Entrar
            </button>
          </form>
        </main>
      </div>
    );
  }

  // ================= ADMIN LAYOUT =================
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

const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ccc",
  outline: "none",
  background: "#fff",
  color: "#000",
};