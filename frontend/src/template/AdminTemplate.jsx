import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "./Header";
import "./admin-template.css";

const STORAGE_KEY = "admin_basic";

export default function AdminTemplate({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isMobile = useMemo(() => window.matchMedia("(max-width: 768px)").matches, []);

  //  session: solo lo ya guardado
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved); // { user, pass }
    } catch {
      return null;
    }
  });

  // draft: lo que estás escribiendo
  const [draft, setDraft] = useState({ user: "", pass: "" });

  const isLogged = Boolean(session?.user && session?.pass);

  const saveLogin = (e) => {
    e.preventDefault();

    const user = draft.user.trim();
    const pass = draft.pass.trim();

    if (!user || !pass) return;

    const nextSession = { user, pass };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);

    navigate("/administracion");
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setDraft({ user: "", pass: "" });
    navigate("/administracion");
  };

  if (isMobile) {
    return (
      <div className="admin-template">
         <Header />
          <main className="admin-main" style={{ padding: 24 }}>
            <Link to="/" className="btn btn--outline" style={{ marginBottom: 12 }}>
              ← Ir a inicio
            </Link>

            <h2>Administración</h2>
            <p>El panel de administración no está disponible en dispositivos móviles.</p>
          </main>
      </div>
    );
  }

  // LOGIN: solo si NO hay session guardada
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
        <main className="admin-main" style={{ padding: 24, maxWidth: 520 }}>
          <h2>Ingresar a Administración</h2>

          <form onSubmit={saveLogin} style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Usuario</span>
              <input
                value={draft.user}
                onChange={(e) => setDraft((p) => ({ ...p, user: e.target.value }))}
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
                onChange={(e) => setDraft((p) => ({ ...p, pass: e.target.value }))}
                style={input}
                placeholder="Escriba su contraseña"
                autoComplete="current-password"
              />
            </label>

            {/* IMPORTANTE: solo se ejecuta al click/Enter */}
            <button type="submit" className="btn btn--primary">
              Entrar
            </button>
          </form>
        </main>
      </div>
    );
  }

  // ... acá tu layout logueado (menú + children), solo cambiá el botón de logout:
  return (
    // ...dentro del return logueado
    <div className="admin-template admin-layout">
      <Header />

      {/* TOPBAR ADMIN */}
      <div className="admin-topbar">
        <div className="admin-topbar__left">
          <Link to="/" className="btn btn--outline">
            ← Ir a inicio
          </Link>
        </div>
        <div className="admin-topbar__right">
          <div className="admin-welcome">
            Te damos la bienvenida, <b>{session?.user ?? "admin"}</b>
          </div>

          <button type="button" onClick={logout} className="btn btn--secondary">
            Cerrar panel
          </button>
        </div>
      </div>

      <main className="admin-main">{children}</main>
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




