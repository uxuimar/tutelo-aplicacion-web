import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";

const BACKEND_BASE = "http://localhost:8080"; // para /uploads/...

function Gallery({ name, imageUrls }) {
    const imgs = useMemo(() => (Array.isArray(imageUrls) ? imageUrls : []), [imageUrls]);
    const [active, setActive] = useState(0);
    const [open, setOpen] = useState(false);
    const [showAllThumbs, setShowAllThumbs] = useState(false);
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

    // teclas en modal
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

        if (Math.abs(diff) < 40) return; // umbral

        if (diff > 0) prev(e);  // swipe right -> anterior
        else next(e);           // swipe left -> siguiente
    };


    return (
        <>
            <div className="gallery">

                <button type="button" className="gallery-hero" onClick={() => openAt(active)} aria-label="Abrir imagen">
                    <img className="gallery-heroImg" src={activeSrc} alt={name} />
                </button>

                {/* Botón “Ver más” + miniaturas SOLO cuando open === true */}
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
                                <button className="lightbox-nav lightbox-nav--left" type="button" onClick={prev} aria-label="Anterior">
                                    ‹
                                </button>
                                <button className="lightbox-nav lightbox-nav--right" type="button" onClick={next} aria-label="Siguiente">
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

                <div className="booking-note muted">
                    Texto para Términos y Condiciones.
                </div>
            </div>
        </aside>
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
        // demo: después lo conectamos a un endpoint real
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
                        </div>

                        <BookingCard onReserve={onReserve} />
                    </div>
                )}
            </section>
        </>
    );
}
