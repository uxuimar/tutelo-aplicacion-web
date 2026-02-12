import { useEffect, useState } from "react";
import { api } from "../api/api";

const initialForm = {
  name: "",
  city: "",
  address: "",
  description: "",
};

const STORAGE_KEY = "admin_basic";

// toma user/pass del login guardado por AdminTemplate
const adminAuthHeader = () => {
  let user = "admin";
  let pass = "admin123";

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.user) user = parsed.user;
      if (parsed?.pass) pass = parsed.pass;
    }
  } catch {
    // fallback silencioso
  }

  const token = btoa(`${user}:${pass}`);
  return { Authorization: `Basic ${token}` };
};

// helpers de imágenes (fuera del componente)
const normalizeImageUrls = (data) => {
  if (!data) return [];

  // caso: { imageUrls: [...] }
  if (Array.isArray(data?.imageUrls)) {
    return data.imageUrls.filter(Boolean);
  }

  // caso: { images: [...] }
  if (Array.isArray(data?.images)) {
    return normalizeImageUrls(data.images);
  }

  // caso: ["url1","url2"]
  if (Array.isArray(data) && typeof data[0] === "string") {
    return data.filter(Boolean);
  }

  // caso: [{url},{path}]
  if (Array.isArray(data) && typeof data[0] === "object") {
    return data
      .map((img) => img?.url || img?.path || img?.src || img?.imageUrl)
      .filter(Boolean);
  }

  return [];
};

export default function AdminHotelsPage() {
  // 1) STATES
  const [view, setView] = useState("cards"); // "cards" | "list"
  const [hotels, setHotels] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]); // multi-fotos
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editHotel, setEditHotel] = useState(null);
  const [editImages, setEditImages] = useState([]);
  const [removingUrl, setRemovingUrl] = useState("");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteHotelTarget, setDeleteHotelTarget] = useState(null);
  const [deletingHotelId, setDeletingHotelId] = useState(null);



  // cache de imágenes por hotel (para completar cuando /hotels no trae todo)
  const [imagesByHotelId, setImagesByHotelId] = useState({});

  // edición (sin modal, reutiliza el mismo box)
  const [editingHotel, setEditingHotel] = useState(null); // {id, name, city, address, description}

  // Backend aún NO soporta DELETE de imágenes -> Deshabilita el boton de borrar foto
  const canDeleteImages = true;

  // 2) LOAD (GET) -> muestra los hoteles existentes (público)
  const loadHotels = async () => {
    setError("");
    setLoading(true);
    try {
      // IMPORTANTE: sin "/api" (porque baseURL probablemente ya trae /api)
      const res = await api.get("/hotels");
      setHotels(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      const msg = e?.response?.data
        ? JSON.stringify(e.response.data)
        : (e?.message ?? String(e));
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  // HELPERS: extraer URLs desde el objeto del hotel
  const pickHotelImageUrls = (h) => {
    if (Array.isArray(h?.images) && h.images.length > 0) {
      return h.images
        .map((img) => img?.url || img?.path || img?.src || img?.imageUrl)
        .filter(Boolean);
    }

    if (Array.isArray(h?.photos) && h.photos.length > 0) {
      return h.photos
        .map((img) => img?.url || img?.path || img?.src || img?.imageUrl)
        .filter(Boolean);
    }

    if (Array.isArray(h?.imageUrls) && h.imageUrls.length > 0) {
      return h.imageUrls.filter(Boolean);
    }

    const single =
      h?.coverUrl || h?.thumbnailUrl || h?.imageUrl || h?.photoUrl || h?.mainImageUrl;

    return single ? [single] : [];
  };

  // Esto llama las imágenes en el popup
  const toAbsoluteImgSrc = (maybeRelative) => {
    if (!maybeRelative) return "";

    // ya es absoluta
    if (/^(https?:)?\/\//i.test(maybeRelative) || /^(data:|blob:)/i.test(maybeRelative)) {
      return maybeRelative;
    }

    const base = api?.defaults?.baseURL || ""; // "/api" o "http://localhost:8080/api"

    // Si baseURL es absoluta, sacamos el origin real del backend
    if (base.startsWith("http")) {
      const backendOrigin = new URL(base).origin; // "http://localhost:8080"
      return new URL(maybeRelative, backendOrigin).toString();
    }

    // Si baseURL es relativa ("/api"), NO podemos inferir el backend desde window.origin (5173)
    // Usamos el backend real donde están los uploads:
    const backendOrigin = "http://localhost:8080";
    return new URL(maybeRelative, backendOrigin).toString();
  };


  //  HIDRATAR IMÁGENES FALTANTES
  useEffect(() => {
    if (!hotels || hotels.length === 0) return;

    let cancelled = false;

    const fetchMissingImages = async () => {
      const targets = hotels.filter((h) => {
        const fromList = pickHotelImageUrls(h);
        const cached = imagesByHotelId[h.id];
        return fromList.length === 0 && (!cached || cached.length === 0);
      });

      if (targets.length === 0) return;

      const results = await Promise.allSettled(
        targets.map(async (h) => {
          const res = await api.get(`/hotels/${h.id}`); // Este es el endpoint
          return { id: h.id, urls: normalizeImageUrls(res.data) };
        })
      );

      if (cancelled) return;

      const patch = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          patch[r.value.id] = r.value.urls;
        }
      });

      if (Object.keys(patch).length) {
        setImagesByHotelId((prev) => ({ ...prev, ...patch }));
      }
    };

    fetchMissingImages();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotels]);

  // 3) HANDLERS

  const openDeleteModal = (hotel) => {
    setError("");
    setDeleteHotelTarget(hotel);
    setIsDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteOpen(false);
    setDeleteHotelTarget(null);
    setDeletingHotelId(null);
  };

  const confirmDeleteHotel = async () => {
    if (!deleteHotelTarget?.id) return;

    setError("");
    setDeletingHotelId(deleteHotelTarget.id);

    try {
      await api.delete(`/admin/hotels/${deleteHotelTarget.id}`, {
        headers: adminAuthHeader(),
      });

      await loadHotels();
      closeDeleteModal();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) setError("No autorizado (401). Revisá usuario/clave de admin.");
      else if (status === 403) setError("Prohibido (403). No tenés permisos de ADMIN.");
      else {
        const msg = e?.response?.data
          ? JSON.stringify(e.response.data)
          : (e?.message ?? String(e));
        setError(msg);
      }
    } finally {
      setDeletingHotelId(null);
    }
  };


  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  const startEdit = async (hotel) => {
    setError("");
    setSubmitting(false);

    try {
      const res = await api.get(`/hotels/${hotel.id}`);
      const full = res.data;

      setEditHotel(full);
      setForm({
        name: full.name ?? "",
        city: full.city ?? "",
        address: full.address ?? "",
        description: full.description ?? "",
      });

      setEditImages(Array.isArray(full.imageUrls) ? full.imageUrls : []);
      setFiles([]);
      setIsEditOpen(true);
    } catch (e) {
      const msg = e?.response?.data
        ? JSON.stringify(e.response.data)
        : (e?.message ?? String(e));
      setError(msg);
    }
  };

  const saveEditModal = async (e) => {
    e.preventDefault();
    setError("");

    if (!editHotel?.id) return;

    const payload = {
      name: form.name?.trim(),
      city: form.city?.trim(),
      address: form.address?.trim(),
      description: form.description?.trim(),
    };

    if (!payload.name || !payload.city || !payload.address) {
      setError("Nombre, Ciudad y Dirección son obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/admin/hotels/${editHotel.id}`, payload, {
        headers: adminAuthHeader(),
      });

      // Subir nuevas imágenes (se SUMAN)
      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));

        await api.post(`/admin/hotels/${editHotel.id}/images`, fd, {
          headers: {
            ...adminAuthHeader(),
            "Content-Type": "multipart/form-data",
          },
        });
      }

      const refreshed = await api.get(`/hotels/${editHotel.id}`);
      setEditHotel(refreshed.data);
      setEditImages(refreshed.data.imageUrls || []);
      setFiles([]);

      await loadHotels();
      setIsEditOpen(false);
    } catch (e) {
      const msg = e?.response?.data
        ? JSON.stringify(e.response.data)
        : (e?.message ?? String(e));
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingHotel(null);
    setForm(initialForm);
    setFiles([]);
  };

  // 4) CREATE + UPLOAD IMAGES (ADMIN)
  const createHotel = async (e) => {
    e.preventDefault();
    setError("");

    const payload = {
      name: form.name?.trim(),
      city: form.city?.trim(),
      address: form.address?.trim(),
      description: form.description?.trim(),
    };

    if (!payload.name || !payload.city || !payload.address) {
      setError("Nombre, Ciudad y Dirección son obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.post("/admin/hotels", payload, {
        headers: adminAuthHeader(),
      });

      const hotelId = created?.data?.id;

      if (hotelId && files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));

        await api.post(`/admin/hotels/${hotelId}/images`, fd, {
          headers: {
            ...adminAuthHeader(),
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setForm(initialForm);
      setFiles([]);
      setShowCreate(false);
      await loadHotels();
    } catch (e) {
      const status = e?.response?.status;

      if (status === 401) {
        setError("No autorizado (401). Revisá usuario/clave de admin.");
      } else if (status === 403) {
        setError("Prohibido (403). No tenés permisos de ADMIN.");
      } else if (status === 409) {
        setError("Ya existe un hotel con ese nombre. Usá otro nombre.");
      } else if (status === 400) {
        setError("Revisá los campos obligatorios (Nombre, Ciudad, Dirección).");
      } else {
        const msg = e?.response?.data
          ? JSON.stringify(e.response.data)
          : (e?.message ?? String(e));
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 5) UPDATE (ADMIN)
  const updateHotel = async (e) => {
    e.preventDefault();
    setError("");

    if (!editingHotel?.id) return;

    const payload = {
      name: form.name?.trim(),
      city: form.city?.trim(),
      address: form.address?.trim(),
      description: form.description?.trim(),
    };

    if (!payload.name || !payload.city || !payload.address) {
      setError("Nombre, Ciudad y Dirección son obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/admin/hotels/${editingHotel.id}`, payload, {
        headers: adminAuthHeader(),
      });

      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));

        await api.post(`/admin/hotels/${editingHotel.id}/images`, fd, {
          headers: {
            ...adminAuthHeader(),
            "Content-Type": "multipart/form-data",
          },
        });
      }

      cancelEdit();
      setShowCreate(false);
      await loadHotels();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) setError("No autorizado (401). Revisá usuario/clave de admin.");
      else if (status === 403) setError("Prohibido (403). No tenés permisos de ADMIN.");
      else {
        const msg = e?.response?.data
          ? JSON.stringify(e.response.data)
          : (e?.message ?? String(e));
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 6) DELETE (ADMIN)
  const deleteHotel = async (id, name) => {
    const confirmed = window.confirm(
      `¿Estás seguro de eliminar el hotel "${name}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setError("");
    try {
      await api.delete(`/admin/hotels/${id}`, {
        headers: adminAuthHeader(),
      });
      await loadHotels();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) setError("No autorizado (401). Revisá usuario/clave de admin.");
      else if (status === 403) setError("Prohibido (403). No tenés permisos de ADMIN.");
      else {
        const msg = e?.response?.data
          ? JSON.stringify(e.response.data)
          : (e?.message ?? String(e));
        setError(msg);
      }
    }
  };

  // Eliminar foto (RESTA)
  const deleteImageByUrl = async (hotelId, url) => {
    setError("");
    setRemovingUrl(url);

    try {
      await api.delete(`/admin/hotels/${hotelId}/images`, {
        headers: adminAuthHeader(),
        params: { url } // pasá el "/uploads/xxx.jpg" tal cual
      });


      const refreshed = await api.get(`/hotels/${hotelId}`);
      setEditHotel(refreshed.data);
      setEditImages(Array.isArray(refreshed.data.imageUrls) ? refreshed.data.imageUrls : []);

      await loadHotels();
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data
        ? JSON.stringify(e.response.data)
        : (e?.message ?? String(e));
      setError(`No se pudo eliminar la imagen. Status: ${status ?? "?"}. ${msg}`);
    } finally {
      setRemovingUrl("");
    }
  };

  // 7) UI
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#e8e8e8" }}>
        <h2>Panel de Administración</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => setView((v) => (v === "cards" ? "list" : "cards"))}
            style={btnSecondary}
          >
            {view === "cards" ? "Lista de productos" : "Cerrar lista"}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCreate((s) => {
                const next = !s;
                if (next) cancelEdit();
                return next;
              });
            }}
            style={btnPrimary}
          >
            {showCreate ? "Cancelar" : "Agregar hotel"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            position: "relative",
            background: "rgba(255, 92, 92, 0.8)",
            padding: "12px 40px 12px 12px",
            borderRadius: 10,
            color: "#e8e8e",
          }}
        >
          <strong>Error:</strong>{" "}
          <span style={{ whiteSpace: "pre-wrap" }}>{error}</span>

          <button
            onClick={() => setError("")}
            aria-label="Cerrar error"
            style={{
              position: "absolute",
              top: 4,
              right: 8,
              background: "transparent",
              border: "none",
              fontSize: 18,
              fontWeight: 900,
              cursor: "pointer",
              color: "#e8e8e",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* BOX PARA AGREGAR / EDITAR HOTELES */}
      {showCreate && (
        <section style={card2}>
          <h3 style={{ marginTop: 0, color: "#232738" }}>
            {editingHotel ? `Editar hotel (ID: ${editingHotel.id})` : "Registrar hotel"}
          </h3>

          <form onSubmit={editingHotel ? updateHotel : createHotel} style={{ display: "grid", gap: 12 }}>
            <div style={grid2}>
              <Field label="Name *">
                <input name="name" value={form.name} onChange={onChange} style={input} placeholder="Hotel Central" />
              </Field>
              <Field label="City *">
                <input name="city" value={form.city} onChange={onChange} style={input} placeholder="Buenos Aires" />
              </Field>
            </div>

            <Field label="Address *">
              <input name="address" value={form.address} onChange={onChange} style={input} placeholder="Calle Falsa 123" />
            </Field>

            <Field label="Description">
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                style={{ ...input, minHeight: 80, resize: "vertical" }}
                placeholder="Descripción..."
              />
            </Field>

            <Field label="Fotos (puedes seleccionar varias)">
              <input style={{ color: "#232738" }} type="file" multiple accept="image/*" onChange={onFilesChange} />
            </Field>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="submit" disabled={submitting} style={btnPrimary2}>
                {submitting ? "Guardando..." : editingHotel ? "Guardar cambios" : "Guardar"}
              </button>

              {editingHotel && (
                <button type="button" onClick={cancelEdit} style={btnSecondary}>
                  Cancelar edición
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (editingHotel) {
                    setForm({
                      name: editingHotel.name ?? "",
                      city: editingHotel.city ?? "",
                      address: editingHotel.address ?? "",
                      description: editingHotel.description ?? "",
                    });
                    setFiles([]);
                  } else {
                    setForm(initialForm);
                    setFiles([]);
                  }
                }}
                style={btnSecondary}
              >
                Limpiar
              </button>

              <button type="button" onClick={loadHotels} style={btnSecondary}>
                Refrescar lista
              </button>
            </div>
          </form>
        </section>
      )}

      {/* HOTELES GUARDADOS */}
      <section style={{ ...card, marginTop: 16 }}>
        <h3 style={{ marginTop: 0, color: "#e8e8e8" }}>Hoteles agregados</h3>

        {loading ? (
          <div>Cargando…</div>
        ) : hotels.length === 0 ? (
          <div style={{ color: "#e8e8e8" }}>No hay hoteles registrados todavía.</div>
        ) : view === "list" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>ID</th>
                  <th style={th}>Nombre</th>
                  <th style={th}>Fotos</th>
                  <th style={th}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {hotels.map((h) => {
                  const urls = imagesByHotelId[h.id] ?? pickHotelImageUrls(h);

                  return (
                    <tr key={h.id}>
                      <td style={td}>{h.id}</td>
                      <td style={td}>{h.name}</td>

                      <td style={td}>
                        {Array.isArray(urls) && urls.length > 0 ? (
                          <span style={{ fontWeight: 500 }}>+{urls.length}</span>
                        ) : (
                          <span style={{ opacity: 0.8 }}>Sin fotos</span>
                        )}
                      </td>

                      <td style={td}>
                        <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
                          <button type="button" style={btnSecondary} onClick={() => startEdit(h)}>
                            Editar
                          </button>
                          <button type="button" style={btnDanger} onClick={() => openDeleteModal(h)}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 12,
            }}
          ></div>
        )}
      </section>

      {/* Modal para editar datos de hoteles */}
      {isEditOpen && (
        <div style={modalOverlay} onClick={() => setIsEditOpen(false)}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0 }}>Editar datos ({editHotel?.name})</h3>

              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                aria-label="Cerrar"
                style={modalCloseBtn}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveEditModal} style={{ display: "grid", gap: 12 }}>
              <input name="name" value={form.name} onChange={onChange} style={input} />
              <input name="city" value={form.city} onChange={onChange} style={input} />
              <input name="address" value={form.address} onChange={onChange} style={input} />

              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                style={{ ...input, minHeight: 80 }}
              />

              <strong style={{ color: "#232738" }}>Fotos actuales ({editImages.length})</strong>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {editImages.map((u) => (
                  <div key={u} style={imageWrap}>
                    <img src={toAbsoluteImgSrc(u)} alt="Hotel" style={imageThumb} />

                    {/* CTA protegido: NO llama al DELETE si backend no lo soporta */}
                    <button
                      type="button"
                      disabled={!canDeleteImages || removingUrl === u}
                      title={!canDeleteImages ? "Eliminar aún no disponible (backend)" : "Eliminar imagen"}
                      onClick={() => {
                        if (!canDeleteImages) return;
                        deleteImageByUrl(editHotel.id, u);
                      }}
                      style={{
                        ...removeCircle,
                        opacity: !canDeleteImages || removingUrl === u ? 0.5 : 1,
                        cursor: !canDeleteImages || removingUrl === u ? "not-allowed" : "pointer",
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <input style={{ color: "#232738" }} type="file" multiple accept="image/*" onChange={onFilesChange} />

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" style={btnSecondary} onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" style={btnPrimary2}>
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal eliminar hotel */}
      {isDeleteOpen && (
        <div style={modalOverlay} onClick={closeDeleteModal}>
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeader}>
              <h3 style={{ margin: 0, color: "#232738" }}>
                Confirmar eliminación
              </h3>

              <button
                type="button"
                onClick={closeDeleteModal}
                aria-label="Cerrar"
                style={modalCloseBtn}
              >
                ×
              </button>
            </div>

            <div style={{ color: "#232738", display: "grid", gap: 10 }}>
              <p style={{ margin: 0 }}>
                ¿Estás seguro de eliminar el hotel{" "}
                <strong>{deleteHotelTarget?.name}</strong> (ID:{" "}
                <strong>{deleteHotelTarget?.id}</strong>)?
              </p>

              <p style={{ margin: 0, opacity: 0.85 }}>
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button type="button" style={btnSecondary} onClick={closeDeleteModal}>
                Cancelar
              </button>

              <button
                type="button"
                style={{
                  ...btnPrimary,
                  opacity: deletingHotelId ? 0.7 : 1,
                  cursor: deletingHotelId ? "not-allowed" : "pointer",
                }}
                disabled={!!deletingHotelId}
                onClick={confirmDeleteHotel}
              >
                {deletingHotelId ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, color: "#232738" }}>{label}</span>
      {children}
    </label>
  );
}

const card = { background: "#0071fb", border: "1px solid #0071fb", borderRadius: 16, padding: 16 };
const card2 = { background: "#e8e8e8", border: "1px solid #232738", borderRadius: 16, padding: 16 };
const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 };
const input = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #6b6b6b",
  background: "rgba(247, 249, 249, 0.91)",
  color: "#0b0d12",
  outline: "none",
};

const btnPrimary = {
  background: "#0071fb",
  color: "#e8e8e8",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 800,
  cursor: "pointer",
  height: "fit-content",
  alignSelf: "anchor-center",
  lineHeight: "1",
};

const btnPrimary2 = {
  background: "#2b3150",
  color: "#e8e8e8",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 800,
  cursor: "pointer",
  height: "fit-content",
  alignSelf: "anchor-center",
  lineHeight: "1",
};

const btnSecondary = {
  background: "transparent",
  color: "#232738",
  border: "1px solid #232738",
  borderRadius: 10,
  padding: "10px 12px",
  fontWeight: 800,
  cursor: "pointer",
  height: "fit-content",
  alignSelf: "anchor-center",
  lineHeight: "1",
};

const btnDanger = {
  background: "#ff5c5c",
  color: "#0b0d12",
  border: "none",
  borderRadius: 10,
  padding: "10px 12px",
  fontWeight: 600,
  cursor: "pointer",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  background: "rgba(247, 249, 249, 0.95)",
  borderRadius: 12,
  overflow: "hidden",
};

const th = {
  textAlign: "left",
  padding: "12px 14px",
  background: "#2b3150",
  color: "#e8e8e8",
  fontSize: 13,
  letterSpacing: 0.4,
};

const td = {
  padding: "12px 14px",
  borderBottom: "1px solid #e6e6e6",
  color: "#0b0d12",
  fontSize: 14,
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "grid",
  placeItems: "center",
  zIndex: 9999,
};

const modalCard = {
  background: "#e8e8e8",
  padding: 20,
  borderRadius: 16,
  width: "min(800px, 95%)",
};

const imageWrap = {
  position: "relative",
  width: 140,
  height: 90,
};

const imageThumb = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: 12,
  border: "1px solid #d9d9d9",
};

const removeCircle = {
  position: "absolute",
  top: -8,
  right: -8,
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: "none",
  background: "#ff5c5c",
  color: "#fff",
  fontSize: 18,
  fontWeight: 900,
  lineHeight: "26px",
  textAlign: "center",
  boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
  color: "#232738",
};

const modalCloseBtn = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  border: "none",
  background: "transparent",
  color: "#232738",
  fontSize: 22,
  fontWeight: 900,
  lineHeight: "34px",
  textAlign: "center",
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};
