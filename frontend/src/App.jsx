import { Routes, Route } from "react-router-dom";
import Template from "./template/Template";
import AdminTemplate from "./template/AdminTemplate";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import HotelsPage from "./pages/HotelsPage";
import AdminHotelsPage from "./pages/AdminHotelsPage";
import HotelDetailPage from "./pages/HotelDetailPage";

import AccountPage from "./pages/AccountPage";

import HotelsByCategoryPage from "./pages/HotelsByCategoryPage";
import HotelsAllPage from "./pages/HotelsAllPage";

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

        {/* Login / Register (público) */}
        <Route
          path="/login"
          element={
            <Template>
              <LoginPage />
            </Template>
          }
        />

        <Route
          path="/register"
          element={
            <Template>
              <RegisterPage />
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
        <Route
        path="/account"
        element={
          <Template>
            <AccountPage />
          </Template>
        }
      />
      <Route
        path="/categories/:categoryId"
        element={
          <Template>
            <HotelsByCategoryPage />
          </Template>
        }
      />
      <Route
        path="/hotels"
        element={
          <Template>
            <HotelsAllPage />
          </Template>
        }
      />

      </Routes>

      {/* Footer GLOBAL, fuera de los templates */}
      <Footer />
    </div>
  );
}
