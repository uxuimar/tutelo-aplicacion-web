import { Routes, Route } from "react-router-dom";
import Template from "./template/Template";
import AdminTemplate from "./template/AdminTemplate";

import HotelsPage from "./pages/HotelsPage";
import AdminHotelsPage from "./pages/AdminHotelsPage";
import HotelDetailPage from "./pages/HotelDetailPage";

import Footer from "./components/Footer";

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        {/* Sitio público */}
        <Route
          path="/"
          element={
            <Template>
              <HotelsPage />
            </Template>
          }
        />

        {/* Detalle */}
        <Route
          path="/hotels/:id"
          element={
            <Template>
              <HotelDetailPage />
            </Template>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/hotels"
          element={
            <AdminTemplate>
              <AdminHotelsPage />
            </AdminTemplate>
          }
        />

        {/* Alias requerido por criterio */}
          <Route
            path="/administracion"
            element={
              <AdminTemplate>
                <AdminHotelsPage />
              </AdminTemplate>
            }
          />

          <Route
            path="/administracion/hotels"
            element={
              <AdminTemplate>
                <AdminHotelsPage />
              </AdminTemplate>
            }
          />
      </Routes>


      {/* Footer GLOBAL, fuera de los templates */}
      <Footer />
    </div>
  );
}
