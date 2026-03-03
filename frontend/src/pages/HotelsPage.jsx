import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

/**
 * Helpers para leer categorías desde el objeto hotel,
 * backend devuelve:
 * categories: [{ id, name, ... }]
 */
function readHotelCategories(h) {
  const raw = h?.categories ?? [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((c) => ({
      id: c?.id,
      name: c?.name,
    }))
    .filter((x) => x.id && x.name);
}

/**
 * Convierte imageUrl relativo (ej: /uploads/...) a absoluto (http://localhost:8080/uploads/...)
 * Mantiene compatibilidad si api.baseURL no es http.
 */
const toAbsoluteImgSrc = (maybeRelative) => {
  if (!maybeRelative) return "";
  if (/^(https?:)?\/\//i.test(maybeRelative) || /^(data:|blob:)/i.test(maybeRelative)) return maybeRelative;

  const base = api?.defaults?.baseURL || "";
  if (base.startsWith("http")) {
    const backendOrigin = new URL(base).origin;
    return new URL(maybeRelative, backendOrigin).toString();
  }

  // fallback local
  return new URL(maybeRelative, "http://localhost:8080").toString();
};

function MiniCarousel({ name, imageUrls }) {
  const base = "http://localhost:8080";
  const imgs = Array.isArray(imageUrls) ? imageUrls.slice(0, 3) : [];
  const [i, setI] = useState(0);

  const has = imgs.length > 0;
  const currentSrc = has ? `${base}${imgs[i]}` : "https://picsum.photos/seed/hotel/900/600";

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!has) return;
    setI((v) => (v - 1 + imgs.length) % imgs.length);
  };

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!has) return;
    setI((v) => (v + 1) % imgs.length);
  };

  return (
    <div className="reco-imgWrap">
      <img className="reco-img" src={currentSrc} alt={name} />

      {imgs.length > 1 && (
        <>
          <button type="button" className="carousel-btn carousel-btn--left" onClick={prev} aria-label="Anterior">
            ‹
          </button>
          <button type="button" className="carousel-btn carousel-btn--right" onClick={next} aria-label="Siguiente">
            ›
          </button>
          <div className="carousel-dots" aria-hidden="true">
            {imgs.map((_, idx) => (
              <span key={idx} className={`dot ${idx === i ? "dot--active" : ""}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Genera items tipo: 1 2 3 … 15 (con vecinos del current)
function getPageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);

  const nums = [...items]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);

  const out = [];
  for (let i = 0; i < nums.length; i++) {
    out.push(nums[i]);
    const next = nums[i + 1];
    if (next && next - nums[i] > 1) out.push("...");
  }
  return out;
}

export default function HotelsPage() {
  const PAGE_SIZE = 10; // (por si luego lo uso en otra sección)
  const RECO_PAGE_SIZE = 2; // recomendaciones: 2 cards visibles (<= 10)

  const navigate = useNavigate();

  const [destination, setDestination] = useState("Buenos Aires, Argentina");
  const [dates, setDates] = useState("");
  const [guests, setGuests] = useState(2);

  // paginación general
  const [page, setPage] = useState(1);

  // paginación SOLO para recomendaciones
  const [recoPage, setRecoPage] = useState(1);

  // hoteles reales
  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [errorHotels, setErrorHotels] = useState("");

  // ✅ categorías reales desde /api/categories (con imageUrl)
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState("");

  // accesibilidad: foco al cambiar página de recomendaciones
  const recoHeadingRef = useRef(null);

  // cargar hoteles
  useEffect(() => {
    let mounted = true;

    const loadHotels = async () => {
      setLoadingHotels(true);
      setErrorHotels("");

      try {
        const res = await api.get("/hotels"); // => /api/hotels (vite proxy)
        if (!mounted) return;

        const list = Array.isArray(res.data) ? res.data : [];
        setHotels(list);

        // reseteos al recargar data
        setPage(1);
        setRecoPage(1);
      } catch (e) {
        if (!mounted) return;
        setHotels([]);
        setErrorHotels(
          e?.response?.data ? JSON.stringify(e.response.data) : (e?.message ?? "No se pudieron cargar los hoteles.")
        );
      } finally {
        if (mounted) setLoadingHotels(false);
      }
    };

    loadHotels();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ cargar categorías (con imageUrl) desde backend
  useEffect(() => {
    let mounted = true;

    const loadCategories = async () => {
      setLoadingCategories(true);
      setErrorCategories("");

      try {
        const res = await api.get("/categories"); // => /api/categories
        if (!mounted) return;

        const list = Array.isArray(res.data) ? res.data : [];
        setCategories(list);
      } catch (e) {
        if (!mounted) return;
        setCategories([]);
        setErrorCategories(
          e?.response?.data ? JSON.stringify(e.response.data) : (e?.message ?? "No se pudieron cargar las categorías.")
        );
      } finally {
        if (mounted) setLoadingCategories(false);
      }
    };

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  // ✅ contador de hoteles por categoryId (para mostrar "X hoteles" bajo cada categoría)
  const hotelsCountByCategoryId = useMemo(() => {
    const map = new Map(); // id -> count
    (Array.isArray(hotels) ? hotels : []).forEach((h) => {
      const cats = readHotelCategories(h);
      cats.forEach((c) => {
        const prev = map.get(c.id) || 0;
        map.set(c.id, prev + 1);
      });
    });
    return map;
  }, [hotels]);

  // paginación general (no usada en UI ahora, pero lo dejamos)
  const totalPages = Math.max(1, Math.ceil(hotels.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pagedHotels = hotels.slice(start, start + PAGE_SIZE); // eslint-disable-line no-unused-vars

  // paginación recomendaciones
  const recoTotalPages = Math.max(1, Math.ceil(hotels.length / RECO_PAGE_SIZE));
  const safeRecoPage = Math.min(recoPage, recoTotalPages);
  const recoStart = (safeRecoPage - 1) * RECO_PAGE_SIZE;
  const recoHotels = hotels.slice(recoStart, recoStart + RECO_PAGE_SIZE);

  // asegura page válida si cambia el total
  useEffect(() => {
    setRecoPage((p) => Math.min(Math.max(1, p), recoTotalPages));
  }, [recoTotalPages]);

  // foco al título cuando cambia la página
  useEffect(() => {
    if (recoHeadingRef.current) recoHeadingRef.current.focus();
  }, [safeRecoPage]);

  const canSearch = useMemo(() => destination.trim().length > 2, [destination]);

  const onSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (destination.trim()) {
      params.set("city", destination.trim());
    }

    // opcional (si luego querés usarlos)
    if (dates.trim()) {
      params.set("dates", dates.trim());
    }

    if (guests) {
      params.set("guests", guests);
    }

    navigate(`/hotels?${params.toString()}`);
  };

  const categoriesStatusLoading = loadingHotels || loadingCategories;
  const categoriesStatusError = errorHotels || errorCategories;

  return (
    <>
      {/* 1) BUSCADOR */}
      <section className="block block--search home-search" aria-label="Buscador">
        <h1 className="home-title">Busca ofertas en hoteles, mucho más</h1>

        <form className="search-bar" onSubmit={onSearch}>
          <label className="field">
            <span className="field-label">Destino</span>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Buenos Aires, Argentina"
              className="input"
            />
          </label>

          <label className="field">
            <span className="field-label">Check in - Check out</span>
            <input
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              placeholder="Check in - Check out"
              className="input"
            />
          </label>

          <label className="field">
            <span className="field-label">Huéspedes</span>
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="input"
            />
          </label>

          <button className="btn-secondary" disabled={!canSearch}>
            Buscar
          </button>
        </form>
      </section>

      {/* 2) CATEGORÍAS (REALES DESDE DB + IMAGEN SUBIDA) */}
      <section className="block block--categories" aria-label="Buscar por tipo de alojamiento">
        <h2 className="section-title">Buscar por tipo de alojamiento</h2>

        {categoriesStatusLoading ? (
          <div>Cargando categorías…</div>
        ) : categoriesStatusError ? (
          <div>{categoriesStatusError}</div>
        ) : (
          <div className="categories-grid">
            {/* TODOS */}
            <Link
              to="/hotels"
              className="category-card"
              style={{ textDecoration: "none", color: "inherit" }}
              aria-label="Ver todos los alojamientos"
            >
              <img className="category-img" src="https://picsum.photos/seed/tutelo-all/640/360" alt="Todos" />
              <div className="category-body">
                <div className="category-title">Todos</div>
                <div className="category-subtitle">{hotels.length} alojamientos</div>
              </div>
            </Link>

            {/* CATEGORÍAS DESDE DB (con imageUrl) */}
            {categories.length === 0 ? (
              <div style={{ padding: 8 }}>No hay categorías disponibles.</div>
            ) : (
              categories.map((c) => {
                const id = c?.id;
                const label = c?.name ?? "";
                const img = toAbsoluteImgSrc(c?.imageUrl);
                const count = hotelsCountByCategoryId.get(id) || 0;

                const fallbackImg = `https://picsum.photos/seed/${encodeURIComponent(label || "tutelo-cat")}/640/360`;

                return (
                  <button
                    key={id}
                    type="button"
                    className="category-card"
                    onClick={() => navigate(`/categories/${id}`)}
                    aria-label={`Ver ${label}`}
                  >
                    <img
                      className="category-img"
                      src={img || fallbackImg}
                      alt={label}
                      onError={(e) => {
                        // si la imagen subida no se puede cargar, usa fallback sin romper UI
                        e.currentTarget.src = fallbackImg;
                      }}
                    />
                    <div className="category-body">
                      <div className="category-title">{label}</div>
                      <div className="category-subtitle">{count} alojamientos</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* 3) RECOMENDACIONES (REALES) */}
      <section className="block block--recommendations" aria-label="Recomendaciones">
        <h2 className="section-title" tabIndex={-1} ref={recoHeadingRef}>
          Recomendaciones
        </h2>

        {/* SR announcement */}
        <p aria-live="polite" style={{ position: "absolute", left: -9999 }}>
          Página {safeRecoPage} de {recoTotalPages}.
        </p>

        {loadingHotels ? (
          <div>Cargando hoteles…</div>
        ) : errorHotels ? (
          <div>{errorHotels}</div>
        ) : hotels.length === 0 ? (
          <div>No hay hoteles disponibles.</div>
        ) : (
          <>
            <div className="reco-grid" role="list">
              {recoHotels.map((h) => (
                <article key={h.id} className="reco-card" role="listitem">
                  <MiniCarousel name={h.name} imageUrls={h.imageUrls} />

                  <div className="reco-body">
                    <button className="fav" type="button" aria-label="Favorito">
                      ♥
                    </button>

                    <div className="reco-top">
                      <div>
                        <div className="reco-name">{h.name}</div>
                        <div className="reco-city">{h.city}</div>
                      </div>
                    </div>

                    <div className="reco-foot">
                      <span className="muted">{h.address}</span>

                      <button type="button" className="btn-secondary" onClick={() => navigate(`/hotels/${h.id}`)}>
                        Ver detalle
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* PAGINACIÓN */}
            <nav className="pager" aria-label="Paginación de recomendaciones">
              <button
                type="button"
                className="pager-page pager-home"
                onClick={() => setRecoPage(1)}
                disabled={safeRecoPage === 1}
                aria-label="Ir al inicio"
              >
                Inicio
              </button>

              <button
                type="button"
                className="pager-arrow"
                onClick={() => setRecoPage((p) => Math.max(1, p - 1))}
                disabled={safeRecoPage === 1}
                aria-label="Página anterior"
              >
                ‹
              </button>

              <div className="pager-pages" role="list" aria-label={`Página ${safeRecoPage} de ${recoTotalPages}`}>
                {getPageItems(safeRecoPage, recoTotalPages).map((item, idx) =>
                  item === "..." ? (
                    <span key={`dots-${idx}`} className="pager-dots" aria-hidden="true">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      className={`pager-page ${item === safeRecoPage ? "is-active" : ""}`}
                      onClick={() => setRecoPage(item)}
                      aria-label={`Ir a la página ${item}`}
                      aria-current={item === safeRecoPage ? "page" : undefined}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                className="pager-arrow"
                onClick={() => setRecoPage((p) => Math.min(recoTotalPages, p + 1))}
                disabled={safeRecoPage === recoTotalPages}
                aria-label="Página siguiente"
              >
                ›
              </button>

              <span className="pager-meta">
                {safeRecoPage} / {recoTotalPages}
              </span>
            </nav>
          </>
        )}
      </section>
    </>
  );
}