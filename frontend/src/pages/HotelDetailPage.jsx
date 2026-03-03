import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";


const BACKEND_BASE = "http://localhost:8080"; // para /uploads/...

function Gallery({ name, imageUrls }) {
  const imgs = useMemo(() => (Array.isArray(imageUrls) ? imageUrls : []), [imageUrls]);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const MAX_INLINE_THUMBS = 3;

  const has = imgs.length > 0;
  const activeSrc = has ? `${BACKEND_BASE}${imgs[active]}` : "https://picsum.photos/seed/hotel/1200/800";

  const openAt = (idx) => {
    setActive(idx);
    setOpen(true);
  };

  const close = () => setOpen(false);

  const prev = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!has) return;
    setActive((v) => (v - 1 + imgs.length) % imgs.length);
  };

  const next = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!has) return;
    setActive((v) => (v + 1) % imgs.length);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (ev) => {
      if (ev.key === "Escape") close();
      if (ev.key === "ArrowLeft") prev(ev);
      if (ev.key === "ArrowRight") next(ev);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imgs.length]);

  const [touchStartX, setTouchStartX] = useState(null);

  const onTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const onTouchEnd = (e) => {
    if (touchStartX == null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartX;
    setTouchStartX(null);

    if (Math.abs(diff) < 40) return;

    if (diff > 0) prev(e);
    else next(e);
  };

  return (
    <>
      <div className="gallery">
        <button
          type="button"
          className="gallery-hero"
          onClick={() => openAt(active)}
          aria-label="Abrir imagen"
        >
          <img className="gallery-heroImg" src={activeSrc} alt={name} />
        </button>

        {imgs.length > 0 && (
          <div className="gallery-thumbsWrap">
            <button
              type="button"
              className="btn-secondary gallery-moreBtn"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              {open ? "Ocultar fotos" : `Ver más (${imgs.length})`}
            </button>

            {open && (
              <div className="gallery-thumbs" aria-label="Miniaturas">
                {imgs.map((u, idx) => {
                  const src = `${BACKEND_BASE}${u}`;
                  const isActive = idx === active;
                  return (
                    <button
                      key={`${u}-${idx}`}
                      type="button"
                      className={`thumb ${isActive ? "thumb--active" : ""}`}
                      onClick={() => setActive(idx)}
                      aria-label={`Ver imagen ${idx + 1}`}
                    >
                      <img src={src} alt={`${name} - ${idx + 1}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={close}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" type="button" onClick={close} aria-label="Cerrar">
              ✕
            </button>

            <img
              className="lightbox-img"
              src={activeSrc}
              alt={name}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            />

            {imgs.length > 1 && (
              <>
                <button
                  className="lightbox-nav lightbox-nav--left"
                  type="button"
                  onClick={prev}
                  aria-label="Anterior"
                >
                  ‹
                </button>
                <button
                  className="lightbox-nav lightbox-nav--right"
                  type="button"
                  onClick={next}
                  aria-label="Siguiente"
                >
                  ›
                </button>

                <div className="lightbox-dots" aria-hidden="true">
                  {imgs.map((_, i) => (
                    <span key={i} className={`dot ${i === active ? "dot--active" : ""}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function BookingCard({ onReserve }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  const canReserve = Boolean(checkIn && checkOut && guests >= 1);

  return (
    <aside className="booking">
      <div className="booking-top">
        <div className="booking-price">
          <span className="price">$ 89.000</span>
          <span className="muted2">/ noche</span>
        </div>
        <div className="muted2">Impuestos incluidos (demo)</div>
      </div>

      <div className="booking-fields">
        <label className="field">
          <span className="field-label">Check-in</span>
          <input className="input" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">Check-out</span>
          <input className="input" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">Huéspedes</span>
          <input
            className="input"
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
          />
        </label>

        <button className="btn-secondary" disabled={!canReserve} onClick={() => onReserve({ checkIn, checkOut, guests })}>
          Reservar
        </button>

        <div className="booking-note muted">Texto para Términos y Condiciones.</div>
      </div>
    </aside>
  );
}

/** =========================
 *  NUEVO: helpers + UI block
 *  ========================= */

// Normaliza texto para mapear iconos sin depender de backend
/** =========================
 *  NUEVO: Características (con SVGs)
 *  ========================= */

const normKey = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const extractActiveCharacteristics = (hotelDetail) => {
  const arr =
    hotelDetail?.characteristics ||
    hotelDetail?.characteristicValues ||
    hotelDetail?.amenities ||
    [];

  if (!Array.isArray(arr)) return [];

  const out = [];

  for (const item of arr) {
    const ch = item?.characteristic || item;
    const name = ch?.name ?? item?.name;
    const type = String(ch?.type ?? item?.type ?? "").toUpperCase();
    if (!name) continue;

    if (type === "BOOLEAN") {
      const v = item?.boolValue ?? item?.value ?? item?.enabled;
      const enabled = v === true || v === "true" || v === 1 || v === "1";
      if (enabled) out.push({ type: "BOOLEAN", name, value: true });
      continue;
    }

    if (type === "NUMBER") {
      const raw = item?.numValue ?? item?.value;
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) out.push({ type: "NUMBER", name, value: n });
      continue;
    }

    // Fallback si no viene type pero vienen campos:
    if (item?.boolValue !== undefined) {
      if (item.boolValue === true) out.push({ type: "BOOLEAN", name, value: true });
    } else if (item?.numValue !== undefined) {
      const n = Number(item.numValue);
      if (Number.isFinite(n) && n > 0) out.push({ type: "NUMBER", name, value: n });
    }
  }

  return out;
};

// --- SVG Icons (inline, sin librerías)
function SvgIcon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    className: "feature-svg",
    "aria-hidden": "true",
  };

  switch (name) {
    case "wifi":
      return (
        <svg {...common}>
          <path d="M2.5 8.5C8.5 3.5 15.5 3.5 21.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5.5 11.5C10 8 14 8 18.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8.5 14.5C11 12.5 13 12.5 15.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="18" r="1.6" fill="currentColor"/>
        </svg>
      );
    case "pool":
      return (
        <svg {...common}>
          <path d="M6 3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6 7c1-1 2-1 3 0s2 1 3 0 2-1 3 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 17c2 1 4 1 6 0s4-1 6 0 4 1 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 21c2 1 4 1 6 0s4-1 6 0 4 1 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "parking":
      return (
        <svg {...common}>
          <path d="M6 4h8a5 5 0 0 1 0 10H6V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M6 14v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "restaurant":
      return (
        <svg {...common}>
          <path d="M7 3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M9 3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 11h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 3c3 2 3 6 0 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "ac":
      return (
        <svg {...common}>
          <path d="M4 8h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M8 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 8v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "pet":
      return (
        <svg {...common}>
          <path d="M7.5 14.5c1.2-1 3-1 4.5 0 1.5-1 3.3-1 4.5 0 1.8 1.5.6 4.5-2 4.5H9.5c-2.6 0-3.8-3-2-4.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="8" cy="9" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="7.5" r="1.5" fill="currentColor"/>
          <circle cx="16" cy="9" r="1.5" fill="currentColor"/>
        </svg>
      );
    case "tv":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M9 20h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10 17v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 17v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "kitchen":
      return (
        <svg {...common}>
          <path d="M6 3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6 11h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M18 11v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6 14h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "airport":
      return (
        <svg {...common}>
          <path d="M2 16l20-4-20-4 8 4-8 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M10 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "accessibility":
      return (
        <svg {...common}>
          <circle cx="12" cy="5.5" r="1.7" fill="currentColor"/>
          <path d="M6 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10 8l1.2 4.5L8 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14 8l-1.2 4.5L16 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case "smoke-free":
      return (
        <svg {...common}>
          <path d="M3 13h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M15 13h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M17 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
          <path d="M8.5 12l2.2 2.2L15.8 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
  }
}

// Mapea nombre -> key de icono
const iconKeyFor = (label) => {
  const k = normKey(label);

  if (k.includes("wifi") || k.includes("wi-fi")) return "wifi";
  if (k.includes("piscina") || k.includes("pileta")) return "pool";
  if (k.includes("parking") || k.includes("estacionamiento") || k.includes("cochera")) return "parking";
  if (k.includes("restaurante")) return "restaurant";
  if (k.includes("aire") || k.includes("acondicionado")) return "ac";
  if (k.includes("mascota") || k.includes("pet")) return "pet";
  if (k.includes("televisor") || k.includes("tv")) return "tv";
  if (k.includes("cocina")) return "kitchen";
  if (k.includes("traslado") || k.includes("aeropuerto")) return "airport";
  if (k.includes("movilidad reducida") || k.includes("accesible") || k.includes("adaptado")) return "accessibility";
  if (k.includes("24") || k.includes("recepcion")) return "clock";
  if (k.includes("sin humo") || k.includes("no fumar")) return "smoke-free";

  return "check";
};

function CharacteristicsBlock({ hotel }) {
  const items = useMemo(() => extractActiveCharacteristics(hotel), [hotel]);

  return (
    <section style={{ color: "#232738" }} className="features" aria-label="Características del hotel">
      <h3  className="features-title">Características</h3>

      {items.length === 0 ? (
        <div className="features-empty muted">Este alojamiento no tiene características registradas.</div>
      ) : (
        <div className="features-grid">
          {items.map((it, idx) => {
            const iconKey = iconKeyFor(it.name);
            return (
              <div key={`${it.name}-${idx}`} className="feature-item" title={it.name}>
                <span className="feature-ico" aria-hidden="true">
                  <SvgIcon name={iconKey} size={18} />
                </span>

                <span className="feature-text">
                  {it.type === "NUMBER" ? (
                    <>
                      <span className="feature-name">{it.name}</span>
                      <span className="feature-val">: {it.value}</span>
                    </>
                  ) : (
                    <span className="feature-name">{it.name}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get(`/hotels/${id}`);
        if (!mounted) return;
        setHotel(res.data);
      } catch (e) {
        if (!mounted) return;
        setErr(e?.response?.data ? JSON.stringify(e.response.data) : (e?.message ?? "Error cargando hotel"));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const onReserve = (payload) => {
    alert(`Reserva: hotel ${id}\n${JSON.stringify(payload, null, 2)}`);
  };

  return (
    <>
      <section className="block block--search home-search" aria-label="Detalle del producto">
        <div className="detail-head">
          <h1 className="home-title" style={{ margin: 0 }}>Detalle del producto</h1>
          <button className="btn-secondary" onClick={() => navigate(-1)}>← Volver</button>
        </div>
      </section>

      <section className="block block--recommendations" aria-label="Detalle">
        {loading ? (
          <div>Cargando…</div>
        ) : err ? (
          <div>{err}</div>
        ) : !hotel ? (
          <div>No encontrado.</div>
        ) : (
          <div className="detail">
            <div className="detail-main">
              <div className="detail-titleRow">
                <div>
                  <div className="detail-title">{hotel.name}</div>
                  <div className="muted">{hotel.city}</div>
                </div>
                <div className="muted">ID: {hotel.id}</div>
              </div>

              <div className="detail-meta">
                <div><b>Dirección:</b> <span className="muted">{hotel.address}</span></div>
                {hotel.description ? <div className="muted">{hotel.description}</div> : null}
              </div>

              <Gallery name={hotel.name} imageUrls={hotel.imageUrls} />

              {/* ✅ NUEVO BLOQUE: Características */}
              <CharacteristicsBlock hotel={hotel} />
            </div>

            <BookingCard onReserve={onReserve} />
          </div>
        )}
      </section>
    </>
  );
}


