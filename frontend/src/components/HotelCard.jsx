import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

export default function HotelCard({ hotel }) {
  const navigate = useNavigate();

  return (
    <article className="reco-card" role="listitem">
      <MiniCarousel name={hotel?.name} imageUrls={hotel?.imageUrls} />

      <div className="reco-body">
        <button className="fav" type="button" aria-label="Favorito">
          ♥
        </button>

        <div className="reco-top">
          <div>
            <div className="reco-name">{hotel?.name}</div>
            <div className="reco-city">{hotel?.city}</div>
          </div>
        </div>

        <div className="reco-foot">
          <span className="muted">{hotel?.address}</span>

          <button type="button" className="btn-secondary" onClick={() => navigate(`/hotels/${hotel?.id}`)}>
            Ver detalle
          </button>
        </div>
      </div>
    </article>
  );
}