import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../template/Header";
import { api } from "../api/api";
import { useAdminAuth } from "../context/AdminAuthContext";

function buildBasicAuth(user, pass) {
  return `Basic ${btoa(`${user}:${pass}`)}`;
}

function hasAdminRole(profile) {
  const roles = Array.isArray(profile?.roles) ? profile.roles : [];

  const readBool = (v) => v === true || v === "true" || v === 1 || v === "1";

  return (
    roles.includes("ROLE_ADMIN") ||
    roles.includes("ROLE_SUPER_ADMIN") ||
    readBool(profile?.isAdmin) ||
    readBool(profile?.IS_ADMIN) ||
    readBool(profile?.is_admin) ||
    readBool(profile?.isSuperAdmin) ||
    readBool(profile?.IS_SUPER_ADMIN) ||
    readBool(profile?.is_super_admin)
  );
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdminAuthenticated, loginAdmin } = useAdminAuth();

  const [draft, setDraft] = useState({ user: "", pass: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    /*
      CORRECCIÓN - Punto 2: Problemas en autenticación
      Si ya existe sesión admin en memoria, no se vuelve a mostrar
      el login administrativo.
    */
    if (isAdminAuthenticated) {
      navigate("/administracion", { replace: true });
    }
  }, [isAdminAuthenticated, navigate]);

  const submit = async (e) => {
    e.preventDefault();

    const user = draft.user.trim();
    const pass = draft.pass.trim();

    if (!user || !pass) {
      setError("Debes completar usuario y contraseña.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const authHeader = buildBasicAuth(user, pass);

      /*
        CORRECCIÓN - Punto 3: Recomendaciones sobre la autenticación
        El login administrativo también valida sesión mediante Authorization + /me,
        manteniendo un uso consistente de Spring Security en todo el proyecto.
        */

      const { data } = await api.get("/me", {
        headers: {
          Authorization: authHeader,
        },
      });

      if (!hasAdminRole(data)) {
        setError("No tienes permisos para acceder al panel de administración.");
        return;
      }

      /*
        CORRECCIÓN - Punto 2: Problemas en autenticación
        Se guarda la autenticación admin solo en memoria mediante contexto.
        No se persiste contraseña en localhost.
      */
      loginAdmin(
        {
          authenticated: true,
          email: data?.email || user,
          roles: Array.isArray(data?.roles) ? data.roles : [],
          isAdmin: data?.isAdmin,
          isSuperAdmin: data?.isSuperAdmin,
        },
        authHeader
      );

      const from = location.state?.from?.pathname;
      navigate(from || "/administracion", { replace: true });
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        setError("Credenciales inválidas.");
      } else if (status === 403) {
        setError("No tienes permisos para acceder al panel de administración.");
      } else {
        setError("No fue posible validar el acceso administrativo.");
      }
    } finally {
      setLoading(false);
    }
  };

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

      <main className="admin-main" style={{ padding: 24, maxWidth: 520 }}>
        <h2>Ingresar a Administración</h2>
        <p>Acceso exclusivo para administradores autorizados.</p>

        <form
          onSubmit={submit}
          style={{ display: "grid", gap: 12, marginTop: 12 }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <span>Usuario</span>
            <input
              value={draft.user}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, user: e.target.value }))
              }
              style={input}
              placeholder="Escribe tu usuario"
              autoComplete="username"
              disabled={loading}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Contraseña</span>
            <input
              type="password"
              value={draft.pass}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, pass: e.target.value }))
              }
              style={input}
              placeholder="Escribe tu contraseña"
              autoComplete="current-password"
              disabled={loading}
            />
          </label>

          {error && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d9a3a3",
                background: "#fff5f5",
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? "Validando..." : "Entrar"}
          </button>
        </form>
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