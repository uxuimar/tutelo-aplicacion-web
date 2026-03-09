import { Routes, Route } from "react-router-dom";
import Template from "./template/Template";
import AdminTemplate from "./template/AdminTemplate";
import AdminRoute from "./components/AdminRoute";
import { AdminAuthProvider } from "./context/AdminAuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AdminLoginPage from "./pages/AdminLoginPage";

import HotelsPage from "./pages/HotelsPage";
import AdminHotelsPage from "./pages/AdminHotelsPage";
import HotelDetailPage from "./pages/HotelDetailPage";

import AccountPage from "./pages/AccountPage";

import HotelsByCategoryPage from "./pages/HotelsByCategoryPage";
import HotelsAllPage from "./pages/HotelsAllPage";

import Footer from "./components/Footer";

export default function App() {
  return (
    <AdminAuthProvider>
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

          {/* Cuenta */}
          <Route
            path="/account"
            element={
              <Template>
                <AccountPage />
              </Template>
            }
          />

          {/* Categorías / listado */}
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

          {/*
            CORRECCIÓN - Punto 1 y Punto 2
            Login admin separado del panel y autenticación admin
            sostenida por contexto en memoria.
          */}
          <Route
            path="/administracion/login"
            element={<AdminLoginPage />}
          />

          <Route
            path="/admin/hotels"
            element={
              <AdminRoute>
                <AdminTemplate>
                  <AdminHotelsPage />
                </AdminTemplate>
              </AdminRoute>
            }
          />

          <Route
            path="/administracion"
            element={
              <AdminRoute>
                <AdminTemplate>
                  <AdminHotelsPage />
                </AdminTemplate>
              </AdminRoute>
            }
          />

          <Route
            path="/administracion/hotels"
            element={
              <AdminRoute>
                <AdminTemplate>
                  <AdminHotelsPage />
                </AdminTemplate>
              </AdminRoute>
            }
          />
        </Routes>

        <Footer />
      </div>
    </AdminAuthProvider>
  );
}