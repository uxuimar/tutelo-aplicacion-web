import { createContext, useContext, useMemo, useState } from "react";

const AdminAuthContext = createContext(null);

function hasAdminRole(profile) {
  const roles = Array.isArray(profile?.roles) ? profile.roles : [];

  const readBool = (v) => v === true || v === "true" || v === 1 || v === "1";

  return (
    roles.includes("ROLE_ADMIN") ||
    roles.includes("ROLE_SUPER_ADMIN") ||
    readBool(profile?.isAdmin) ||
    readBool(profile?.IS_ADMIN) ||
    readBool(profile?.is_admin) ||
    readBool(profile?.isSuperAdmin) ||
    readBool(profile?.IS_SUPER_ADMIN) ||
    readBool(profile?.is_super_admin)
  );
}

export function AdminAuthProvider({ children }) {
  const [adminProfile, setAdminProfile] = useState(null);
  const [adminAuthHeader, setAdminAuthHeader] = useState(null);

  const loginAdmin = (profile, authHeader) => {
    /*
      CORRECCIÓN VERÓNICA - Punto 2: Problemas en autenticación
      La sesión admin se mantiene solo en memoria.
      No se persiste user/pass en localStorage ni sessionStorage.
    */
    setAdminProfile(profile || null);
    setAdminAuthHeader(authHeader || null);
  };

  const logoutAdmin = () => {
    /*
      CORRECCIÓN VERÓNICA - Punto 2: Problemas en autenticación
      Al cerrar la sesión admin se limpia por completo la memoria
      y no queda información sensible persistida en localhost.
    */
    setAdminProfile(null);
    setAdminAuthHeader(null);
  };

  const value = useMemo(
    () => ({
      adminProfile,
      adminAuthHeader,
      isAdminAuthenticated: Boolean(adminProfile && adminAuthHeader),
      isAdminAuthorized: hasAdminRole(adminProfile),
      loginAdmin,
      logoutAdmin,
    }),
    [adminProfile, adminAuthHeader]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth debe usarse dentro de AdminAuthProvider");
  }
  return ctx;
}