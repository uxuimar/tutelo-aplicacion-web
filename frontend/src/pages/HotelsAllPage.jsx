import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/api";

/* Helpers */
function normalize(str) {
  return (str ?? "").toString().trim().toLowerCase();
}

// ✅ toma "Buenos Aires, Argentina" -> "buenos aires"
function normalizeCityKey(str) {
  const raw = (str ?? "").toString().trim();
  const firstPart = raw.split(",")[0].trim(); // antes de la coma
  return normalize(firstPart);
}

function readHotelCategories(h) {
  const raw = h?.categories ?? [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c) => ({ id: Number(c.id), name: c.name }))
    .filter((c) => Number.isFinite(c.id) && c.name);
}

/* ✅ MiniCarousel local */
function MiniCarousel({ name, imageUrls }) {
  const base = "http://localhost:8080";

  const imgs = Array.isArray(imageUrls) ? imageUrls.filter(Boolean) : [];
  const shown = imgs.slice(0, 5);

  const [i, setI] = useState(0);
  const has = shown.length > 0;

  const currentSrc = has ? `${base}${shown[i]}` : "https://picsum.photos/seed/tutelo-hotel/900/600";

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!has) return;
    setI((v) => (v - 1 + shown.length) % shown.length);
  };

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!has) return;
    setI((v) => (v + 1) % shown.length);
  };

  useEffect(() => {
    setI(0);
  }, [name, shown.length]);

  return (
    <div className="reco-imgWrap">
      <img className="reco-img" src={currentSrc} alt={name} />

      {shown.length > 1 && (
        <>
          <button type="button" className="carousel-btn carousel-btn--left" onClick={prev} aria-label="Anterior">
            ‹
          </button>
          <button type="button" className="carousel-btn carousel-btn--right" onClick={next} aria-label="Siguiente">
            ›
          </button>

          <div className="carousel-dots" aria-hidden="true">
            {shown.map((_, idx) => (
              <span key={idx} className={`dot ${idx === i ? "dot--active" : ""}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function HotelsAllPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filtros
  const [city, setCity] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() => new Set());

  // ✅ cargar city desde query string ?city=
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qCity = params.get("city") ?? "";
    setCity(qCity);
  }, [location.search]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await api.get("/hotels"); // /api/hotels por proxy
        if (!mounted) return;
        setHotels(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (!mounted) return;
        setHotels([]);
        setError(e?.response?.data ? JSON.stringify(e.response.data) : e?.message ?? "No se pudieron cargar los hoteles.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // categorías dinámicas (chips + conteo global)
  const categories = useMemo(() => {
    const map = new Map(); // id -> { id, name, total }
    hotels.forEach((h) => {
      readHotelCategories(h).forEach((c) => {
        const prev = map.get(c.id);
        if (prev) prev.total += 1;
        else map.set(c.id, { id: c.id, name: c.name, total: 1 });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [hotels]);

  // ✅ filtrado real (ciudad + multi-categoría OR)
  const filteredHotels = useMemo(() => {
    const cityKey = normalizeCityKey(city);
    const selected = selectedCategoryIds;

    return hotels.filter((h) => {
      const matchesCity = !cityKey || normalize(h.city).includes(cityKey);

      if (selected.size === 0) return matchesCity;

      const hotelCatIds = new Set(readHotelCategories(h).map((c) => c.id));
      const matchesCategories = Array.from(selected).some((id) => hotelCatIds.has(id));

      return matchesCity && matchesCategories;
    });
  }, [hotels, city, selectedCategoryIds]);

  const totalAll = hotels.length;
  const totalFiltered = filteredHotels.length;

  const toggleCategory = (id) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setCity("");
    setSelectedCategoryIds(new Set());
    // opcional: limpiar URL también
    navigate("/hotels");
  };

  return (
    <section className="block" aria-label="Resultados de hoteles">
      {/* HEADER */}
      <div className="results-head">
        <button type="button" className="btn-secondary results-back" onClick={() => navigate("/")}>
          ← Volver
        </button>

        <div className="results-titleWrap">
          <h1 className="results-title">Todos los alojamientos</h1>
          <p className="results-subtitle">
            Mostrando <b>{totalFiltered}</b> alojamientos (de <b>{totalAll}</b>)
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="results-filters">
        <div className="results-dest">
          <label className="field">
            <span className="field-label" style={{ color: "#2a2d3f" }}>
              Destino (ciudad)
            </span>
            <input
              className="input"
              placeholder="Ej: Buenos Aires"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
        </div>

        <button type="button" className="btn-secondary results-clear" onClick={clearFilters}>
          Limpiar filtros
        </button>

        <div className="results-chips" aria-label="Filtros por categoría">
          {categories.map((c) => {
            const active = selectedCategoryIds.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={`chip ${active ? "chip--active" : ""}`}
                aria-pressed={active}
              >
                {c.name} <span className="chip-count">({c.total})</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 12 }}>Cargando…</div>
      ) : error ? (
        <div style={{ padding: 12 }}>{error}</div>
      ) : totalFiltered === 0 ? (
        <div style={{ padding: 12 }}>No hay resultados con los filtros actuales.</div>
      ) : (
        <div className="hotels-list" style={{ marginTop: 14 }}>
          {filteredHotels.map((h) => (
            <article key={h.id} className="hotelRow">
              <div className="hotelRow__media">
                <MiniCarousel name={h.name} imageUrls={h.imageUrls} />
              </div>

              <div className="hotelRow__content">
                <button style={{ top: "17px" }} className="fav" type="button" aria-label="Favorito">
                  ♥
                </button>

                <div className="hotelRow__title">{h.name}</div>
                <div className="hotelRow__meta">{h.city}</div>
                <div className="hotelRow__meta">{h.address}</div>

                <div className="hotelRow__actions">
                  <button type="button" className="btn-secondary" onClick={() => navigate(`/hotels/${h.id}`)}>
                    Ver detalle
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}