import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/api";
import { useNavigate, Link } from "react-router-dom";


const lodgingTypes = [
  { id: "hotels", title: "Hoteles", subtitle: "807.105 hoteles", img: "https://picsum.photos/seed/hotel/640/360" },
  { id: "hostels", title: "Hostels", subtitle: "807.105 hoteles", img: "https://picsum.photos/seed/hostel/640/360" },
  { id: "apartments", title: "Departamentos", subtitle: "807.105 hoteles", img: "https://picsum.photos/seed/apartment/640/360" },
  { id: "bnb", title: "Bed and breakfast", subtitle: "807.105 hoteles", img: "https://picsum.photos/seed/bnb/640/360" },
];

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

  // accesibilidad: foco al cambiar página de recomendaciones
  const recoHeadingRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadHotels = async () => {
      setLoadingHotels(true);
      setErrorHotels("");

      try {
        const res = await api.get("/hotels");
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
    setPage(1);
    setRecoPage(1);
    alert(`Buscar: ${destination} | Fechas: ${dates || "(sin fechas)"} | Huéspedes: ${guests}`);
  };

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

      {/* 2) CATEGORÍAS */}
      <section className="block block--categories" aria-label="Buscar por tipo de alojamiento">
        <h2 className="section-title">Buscar por tipo de alojamiento</h2>

        <div className="categories-grid">
          {lodgingTypes.map((t) => (
            <button key={t.id} type="button" className="category-card">
              <img className="category-img" src={t.img} alt={t.title} />
              <div className="category-body">
                <div className="category-title">{t.title}</div>
                <div className="category-subtitle">{t.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
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

            {/* PAGINACIÓN estilo "1 2 3 … 15" con flechas */}
            <nav className="pager" aria-label="Paginación de recomendaciones">
              {/* Criterio: botón/enlace para ir al inicio */}
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

              {/* contador visible opcional */}
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
