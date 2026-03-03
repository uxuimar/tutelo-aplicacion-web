import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/api";

import HotelCard from "../components/HotelCard";

export default function HotelsByCategoryPage() {
  const { categoryId } = useParams(); // viene como string
  const navigate = useNavigate();

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/hotels"); // proxy -> localhost:8080/api/hotels
        if (!mounted) return;

        const list = Array.isArray(res.data) ? res.data : [];
        setHotels(list);
      } catch (e) {
        if (!mounted) return;
        setHotels([]);
        setError(
          e?.response?.data ? JSON.stringify(e.response.data) : (e?.message ?? "No se pudieron cargar los hoteles.")
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    return hotels.filter((h) =>
      Array.isArray(h.categories) && h.categories.some((c) => String(c.id) === String(categoryId))
    );
  }, [hotels, categoryId]);

  const categoryName = useMemo(() => {
    const found = hotels
      .flatMap((h) => (Array.isArray(h.categories) ? h.categories : []))
      .find((c) => String(c.id) === String(categoryId));
    return found?.name ?? "Categoría";
  }, [hotels, categoryId]);

  return (
    <section className="block" aria-label="Hoteles por categoría">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="btn-secondary" type="button" onClick={() => navigate("/")}>
          ← Volver
        </button>

        <div>
          <h1 className="section-title" style={{ margin: 0 }}>
            {categoryName}
          </h1>

        </div>

          {/* ✅ NUEVO: contador */}
          {!loading && !error && (
            <div className="muted" style={{ marginTop: 6 }}>
              {filtered.length} {filtered.length === 1 ? "alojamiento encontrado" : "alojamientos encontrados"}
            </div>
          )}
      </div>

      {loading ? (
        <div>Cargando…</div>
      ) : error ? (
        <div>{error}</div>
      ) : filtered.length === 0 ? (
        <div>No hay hoteles en esta categoría.</div>
      ) : (
        <div className="reco-grid" role="list" style={{ marginTop: 16 }}>
          {filtered.map((h) => (
            <HotelCard key={h.id} hotel={h} />
          ))}
        </div>
      )}
    </section>
  );
}