import { useState } from "react";
import { api } from "../api/api";
import { useNavigate, Link } from "react-router-dom";


const USER_STORAGE_KEY = "tutelo_user";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email?.trim() || !form.password) {
      setError("Email y contraseña son obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data));
        window.dispatchEvent(new Event("auth_changed"));
        navigate("/");
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) setError("Email o contraseña incorrectos.");
      else if (status === 400) setError("Revisá los datos ingresados.");
      else setError("Error inesperado al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (

    
    
    <div style={container}>
      <div style={card}>

        <div style={{ marginBottom: 16 }}>
            <Link to="/" style={{ color: "#0071fb", fontWeight: 600 }}>
            ← Ir al inicio
            </Link>
        </div>
        <h2 style={{ marginTop: 0, color: "#0b0d12" }}>Iniciar sesión</h2>

        {error && <div style={{ ...errorStyle }}>{error}</div>}

        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            style={input}
          />

          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={onChange}
            style={input}
          />

          <button type="submit" style={btn} disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div style={{ marginTop: 12, color: "#0b0d12"  }}>
          ¿No tenés cuenta aún? <Link style={{ color: "#0071fb"  }} to="/register"><b>Regístrate</b></Link>
        </div>
      </div>
    </div>
  );
}

const container = {
  minHeight: "80vh",
  display: "grid",
  placeItems: "center",

};

const card = {
  width: "min(420px, 92vw)",
  background: "#fff",
  padding: 24,
  borderRadius: 12,
  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
};

const input = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ccc",
  outline: "none",
   background: "#f9f9f9",
  color: "#0b0d12"
};

const btn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  background: "#0071fb",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const errorStyle = {
  background: "#ff5c5c",
  color: "#fff",
  padding: 10,
  borderRadius: 10,
  marginBottom: 12,

};
