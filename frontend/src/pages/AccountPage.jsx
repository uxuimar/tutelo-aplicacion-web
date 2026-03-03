import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const USER_STORAGE_KEY = "tutelo_user";

export default function AccountPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      navigate("/login");
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
      navigate("/login");
    }
  }, [navigate]);

  if (!user) return null;

  const initials =
    ((user?.firstName?.trim()?.[0] || "") + (user?.lastName?.trim()?.[0] || "")).toUpperCase() || "U";

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={head}>
          <div style={avatar}>{initials}</div>
          <div>
            <h2 style={{ margin: 0, color: "#0071fb"}}>Mi cuenta</h2>
            <div style={{ opacity: 0.8 }}>{user.email}</div>
          </div>
        </div>

        <div style={box}>
          <div><b>Nombre:</b> {user.firstName}</div>
          <div><b>Apellido:</b> {user.lastName}</div>
          <div><b>Email:</b> {user.email}</div>
        </div>

        <div style={{ marginTop: 16, opacity: 0.85 }}>
          {/* Bloque: Reservas (placeholder) */}
                <div style={section}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                    <h3 style={{ margin: 0, color: "#0b0d12" }}>Mis reservas</h3>
                    
                    </div>

                    <Link to="/" style={miniCta}>
                    Explorar alojamientos →
                    </Link>
                </div>

                <div style={emptyBox}>
                    <div style={{ fontWeight: 800, color: "#0b0d12" }}>Todavía no tenés reservas</div>
                    <div style={{ marginTop: 6, color: "#0b0d12", opacity: 0.75 }}>
                    Cuando realices una reserva, aparecerá listada acá con fechas, estado y detalle.
                    </div>
                </div>
                </div>
        </div>
      </div>
    </div>
  );
}

const wrap = { minHeight: "80vh", display: "grid", placeItems: "center", padding: 16 };
const card = {
  width: "min(720px, 96vw)",
  background: "#fff",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 12px 30px rgba(0,0,0,0.10)",
  color: "#0b0d12",
  
};
const head = { display: "flex", gap: 12, alignItems: "center" };
const avatar = {
  width: 44,
  height: 44,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  background: "#e8e8e8",
  color: "#0b0d12",
};
const box = {
  marginTop: 16,
  background: "#f6f7fb",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: 14,
  display: "grid",
  gap: 6,
};

const section = {
  marginTop: 18,
  paddingTop: 16,
  borderTop: "1px solid rgba(0,0,0,0.08)",
};

const emptyBox = {
  marginTop: 12,
  background: "#f6f7fb",
  border: "1px dashed rgba(0,0,0,0.18)",
  borderRadius: 12,
  padding: 14,
};

const miniCta = {
  textDecoration: "none",
  color: "#0071fb",
  fontWeight: 800,
  whiteSpace: "nowrap",
};