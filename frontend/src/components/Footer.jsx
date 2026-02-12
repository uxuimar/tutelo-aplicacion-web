export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="app-footer" role="contentinfo">
      <div className="app-footer__inner">
        <div className="app-footer__left">
          {/* Isologo */}
          <div className="app-footer__brand" aria-label="Isologo empresa">
            {/* Opción A: texto */}
            <span className="app-footer__logo">TUTELO</span>

            {/* Opción B: si tenés imagen en /public/logo.svg, usá esto:
              <img className="app-footer__logoImg" src="/logo.svg" alt="TUTELOH" />
            */}
          </div>

          <div className="app-footer__meta">
            <span>© {year} TUTELO</span>
            <span className="app-footer__sep">•</span>
            <span>Todos los derechos reservados</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
