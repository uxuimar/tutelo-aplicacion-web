import { useState } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function RegisterPage() {

  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // auto-login despues del registro de usuario
        const res = await api.post("/auth/register", form);

        // auto-login
        localStorage.setItem("tutelo_user", JSON.stringify(res.data));
        window.dispatchEvent(new Event("auth_changed"));

        setSuccess("Registro exitoso. Sesión iniciada.");

        setTimeout(() => {
        navigate("/");
        }, 500);

    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : (e?.message ?? "");
      if (status === 409) setError("Ya existe una cuenta con ese email.");
      else if (status === 400) setError("Revisa los datos ingresados.");
      else if (status === 401) setError("No autorizado (401). El backend está bloqueando /auth/register.");
      else if (status === 403) setError("Prohibido (403). Reglas de seguridad bloquearon el registro.");
      else setError(`Error inesperado. Status: ${status ?? "?"}. ${msg}`);
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
        <h2 style={{ color: "#0b0d12" }} >Crear cuenta</h2>

        {error && <div style={errorStyle}>{error}</div>}
        {success && <div style={successStyle}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>

          <input
            name="firstName"
            placeholder="Nombre"
            value={form.firstName}
            onChange={onChange}
            style={input}
          />

          <input
            name="lastName"
            placeholder="Apellido"
            value={form.lastName}
            onChange={onChange}
            style={input}
          />

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
            placeholder="Contraseña (mínimo 8 caracteres)"
            value={form.password}
            onChange={onChange}
            style={input}
          />

          <button type="submit" disabled={loading} style={button}>
            {loading ? "Registrando..." : "Registrarse"}
          </button>

        </form>
      </div>
    </div>
  );
}

const container = {
  minHeight: "80vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",

};

const card = {
  width: 400,
  background: "#fff",
  padding: 30,
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
};

const input = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  background: "#f9f9f9",
  color: "#0b0d12"
};

const button = {
  padding: 10,
  borderRadius: 8,
  border: "none",
  background: "#0071fb",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer"
};

const errorStyle = {
  background: "#ff5c5c",
  color: "#fff",
  padding: 8,
  borderRadius: 6,
  marginBottom: 12,
};

const successStyle = {
  background: "#28a745",
  color: "#fff",
  padding: 8,
  borderRadius: 6,
   marginBottom: 12,
};
