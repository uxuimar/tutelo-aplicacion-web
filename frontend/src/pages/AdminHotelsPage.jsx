import { useEffect, useRef, useState } from "react";
import { api } from "../api/api";
import { useAdminAuth } from "../context/AdminAuthContext";

const initialForm = { name: "", city: "", address: "", description: "" };

//  Categorías: SIN imageUrl (solo archivo local)
const initialCategoryForm = { name: "", slug: "", description: "" };

const normalizeImageUrls = (data) => {
  if (!data) return [];
  if (Array.isArray(data?.imageUrls)) return data.imageUrls.filter(Boolean);
  if (Array.isArray(data?.images)) return normalizeImageUrls(data.images);
  if (Array.isArray(data) && typeof data[0] === "string") return data.filter(Boolean);

  if (Array.isArray(data) && typeof data[0] === "object") {
    return data
      .map((img) => img?.url || img?.path || img?.src || img?.imageUrl)
      .filter(Boolean);
  }
  return [];
};

// --- extractor compatible con backend real
const extractHotelCharacteristicState = (hotelDetail) => {
  const bools = {};
  const nums = {};

  const arr =
    hotelDetail?.characteristics ||
    hotelDetail?.characteristicValues ||
    hotelDetail?.amenities ||
    [];

  if (!Array.isArray(arr)) return { bools, nums };

  for (const item of arr) {
    const id = item?.characteristic?.id ?? item?.id ?? item?.characteristicId;
    if (!id) continue;

    const type = String(item?.characteristic?.type ?? item?.type ?? "").toUpperCase();

    if (type === "BOOLEAN") {
      const v = item?.boolValue ?? item?.value ?? item?.val ?? item?.enabled;
      bools[id] = v === true || v === "true" || v === 1 || v === "1";
      continue;
    }

    if (type === "NUMBER") {
      const raw = item?.numValue ?? item?.value ?? item?.val;
      const n = Number(raw);
      nums[id] = Number.isFinite(n) ? n : 0;
      continue;
    }

    if (item?.boolValue !== undefined) {
      bools[id] = item.boolValue === true;
    } else if (item?.numValue !== undefined) {
      const n = Number(item.numValue);
      nums[id] = Number.isFinite(n) ? n : 0;
    }
  }

  return { bools, nums };
};

export default function AdminHotelsPage(props) {
  const { adminAuthHeader } = useAdminAuth();

  const canEditFromTemplate = props?.canEdit;
  const isAdminFromTemplate = props?.isAdmin;
  const isSuperAdminFromTemplate = props?.isSuperAdmin;

  const createModalFormRef = useRef(null);
  const editModalFormRef = useRef(null);

  //  NUEVO: refs para forms de categorías (porque los botones están en el footer fuera del <form>)
  const categoryCreateFormRef = useRef(null);
  const categoryEditFormRef = useRef(null);

  const [activeTab, setActiveTab] = useState("hotels");
  const [hotelsBoxOpen] = useState(true);
  const [categoriesBoxOpen, setCategoriesBoxOpen] = useState(true);

  const [view, setView] = useState("cards");
  const [hotels, setHotels] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState([]);
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

  const [categories, setCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [editCategoryIds, setEditCategoryIds] = useState([]);

  //  ADMIN categorías
  const [showCategoriesAdmin, setShowCategoriesAdmin] = useState(false);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  //  archivo local (solo 1)
  const [categoryImageFile, setCategoryImageFile] = useState(null);

  const [isCategoryEditOpen, setIsCategoryEditOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [categoryEditSubmitting, setCategoryEditSubmitting] = useState(false);

  //  archivo local (solo 1) en edición
  const [editCategoryImageFile, setEditCategoryImageFile] = useState(null);

  // características
  const [characteristics, setCharacteristics] = useState([]);
  const [selectedCharacteristicBools, setSelectedCharacteristicBools] = useState({});
  const [selectedCharacteristicNums, setSelectedCharacteristicNums] = useState({});
  const [editCharacteristicBools, setEditCharacteristicBools] = useState({});
  const [editCharacteristicNums, setEditCharacteristicNums] = useState({});

  const [imagesByHotelId, setImagesByHotelId] = useState({});
  const [characteristicsCountByHotelId, setCharacteristicsCountByHotelId] = useState({});
  const [characteristicsStateByHotelId, setCharacteristicsStateByHotelId] = useState({});

  const canDeleteImages = true;

  // AUTHZ
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);

  const readBool = (v) => v === true || v === "true" || v === 1 || v === "1";

  const isSuperAdminLocal =
    readBool(me?.isSuperAdmin) ||
    readBool(me?.IS_SUPER_ADMIN) ||
    readBool(me?.is_super_admin);

  const isEditorLocal =
    readBool(me?.isAdmin) ||
    readBool(me?.IS_ADMIN) ||
    readBool(me?.is_admin) ||
    readBool(me?.admin);

  const canEdit =
    typeof canEditFromTemplate === "boolean"
      ? canEditFromTemplate
      : isSuperAdminLocal || isEditorLocal;

  // cerrar UI editable si no puede editar
  useEffect(() => {
    if (!canEdit) {
      setShowCreate(false);
      setIsEditOpen(false);
      setIsDeleteOpen(false);
      setEditHotel(null);
      setFiles([]);
      setShowCategoriesAdmin(false);
      setIsCategoryEditOpen(false);
      setEditCategory(null);
      setCategoryImageFile(null);
      setEditCategoryImageFile(null);
    }
  }, [canEdit]);

  const loadHotels = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/hotels");
      setHotels(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message ?? String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setError("");
    try {
      const res = await api.get("/categories");
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message ?? String(e);
      setError(`No se pudieron cargar categorías: ${msg}`);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  // bloquear scroll detrás si hay modales
  useEffect(() => {
    const anyModalOpen =
      !!showCreate ||
      !!isEditOpen ||
      !!isDeleteOpen ||
      !!showCategoriesAdmin ||
      !!isCategoryEditOpen;

    if (!anyModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow || "";
    };
  }, [showCreate, isEditOpen, isDeleteOpen, showCategoriesAdmin, isCategoryEditOpen]);

  // /me
  useEffect(() => {
    /*
      CORRECCIÓN - Punto 2: Problemas en autenticación
      AdminHotelsPage deja de depender del esquema viejo admin_basic en localStorage.
      Los permisos del panel vienen desde AdminTemplate por props seguras
      y desde el contexto admin en memoria.
    */
    if (typeof canEditFromTemplate === "boolean") {
      setMeLoading(false);
      setMe({
        isAdmin: !!isAdminFromTemplate,
        isSuperAdmin: !!isSuperAdminFromTemplate,
      });
      return;
    }

    setMe(null);
    setMeLoading(false);
  }, [canEditFromTemplate, isAdminFromTemplate, isSuperAdminFromTemplate]);

  // categorías
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await api.get("/categories");
        if (!cancelled) setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message ?? String(e);
        if (!cancelled) setError(`No se pudieron cargar categorías: ${msg}`);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // características
  useEffect(() => {
    if (meLoading) return;
    let cancelled = false;

    const loadCharacteristics = async () => {
      try {
        /*
          CORRECCIÓN - Punto 2: Problemas en autenticación
          La carga de características para el panel ya no usa /admin/characteristics
          con credenciales persistidas en localStorage.
          Se consume el endpoint público /characteristics para evitar el 401
          que estaba rompiendo el panel admin.
        */
        const res = await api.get("/characteristics");

        if (!cancelled) {
          setCharacteristics(Array.isArray(res.data) ? res.data : []);
        }
      } catch (e) {
        const msg = e?.response?.data
          ? JSON.stringify(e.response.data)
          : e?.message ?? String(e);

        if (!cancelled) {
          setError((prev) => prev || `No se pudieron cargar características: ${msg}`);
        }
      }
    };

    loadCharacteristics();

    return () => {
      cancelled = true;
    };
  }, [meLoading]);

  // helpers imgs
  const pickHotelImageUrls = (h) => {
    if (Array.isArray(h?.images) && h.images.length > 0) {
      return h.images.map((img) => img?.url || img?.path || img?.src || img?.imageUrl).filter(Boolean);
    }
    if (Array.isArray(h?.photos) && h.photos.length > 0) {
      return h.photos.map((img) => img?.url || img?.path || img?.src || img?.imageUrl).filter(Boolean);
    }
    if (Array.isArray(h?.imageUrls) && h.imageUrls.length > 0) return h.imageUrls.filter(Boolean);

    const single = h?.coverUrl || h?.thumbnailUrl || h?.imageUrl || h?.photoUrl || h?.mainImageUrl;
    return single ? [single] : [];
  };

  const toAbsoluteImgSrc = (maybeRelative) => {
    if (!maybeRelative) return "";
    if (/^(https?:)?\/\//i.test(maybeRelative) || /^(data:|blob:)/i.test(maybeRelative)) return maybeRelative;

    const base = api?.defaults?.baseURL || "";
    if (base.startsWith("http")) {
      const backendOrigin = new URL(base).origin;
      return new URL(maybeRelative, backendOrigin).toString();
    }
    const backendOrigin = "http://localhost:8080";
    return new URL(maybeRelative, backendOrigin).toString();
  };

  // hidratar imágenes faltantes + características
  useEffect(() => {
    if (!hotels || hotels.length === 0) return;
    let cancelled = false;

    const fetchMissing = async () => {
      const targets = hotels.filter((h) => {
        const fromList = pickHotelImageUrls(h);
        const cached = imagesByHotelId[h.id];
        return fromList.length === 0 && (!cached || cached.length === 0);
      });

      const detailTargets = hotels.filter((h) => characteristicsCountByHotelId[h.id] == null);
      const jobs = [];

      if (targets.length > 0) {
        jobs.push(
          Promise.allSettled(
            targets.map(async (h) => {
              const res = await api.get(`/hotels/${h.id}`);
              return { id: h.id, urls: normalizeImageUrls(res.data) };
            })
          ).then((results) => {
            const patch = {};
            results.forEach((r) => {
              if (r.status === "fulfilled") patch[r.value.id] = r.value.urls;
            });
            if (!cancelled && Object.keys(patch).length) {
              setImagesByHotelId((prev) => ({ ...prev, ...patch }));
            }
          })
        );
      }

      if (detailTargets.length > 0) {
        jobs.push(
          Promise.allSettled(
            detailTargets.slice(0, 10).map(async (h) => {
              const res = await api.get(`/hotels/${h.id}`);
              const full = res.data;

              const arr = full?.characteristics || full?.characteristicValues || full?.amenities || [];
              const count = Array.isArray(arr) ? arr.length : 0;
              const state = extractHotelCharacteristicState(full);

              return { id: h.id, count, state };
            })
          ).then((results) => {
            const patchCount = {};
            const patchState = {};
            results.forEach((r) => {
              if (r.status === "fulfilled") {
                patchCount[r.value.id] = r.value.count;
                patchState[r.value.id] = r.value.state;
              }
            });
            if (!cancelled) {
              if (Object.keys(patchCount).length) {
                setCharacteristicsCountByHotelId((prev) => ({ ...prev, ...patchCount }));
              }
              if (Object.keys(patchState).length) {
                setCharacteristicsStateByHotelId((prev) => ({ ...prev, ...patchState }));
              }
            }
          })
        );
      }

      await Promise.allSettled(jobs);
    };

    fetchMissing();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotels, characteristics]);

  // delete modal
  const openDeleteModal = (hotel) => {
    if (!canEdit || meLoading) return;
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
    if (!canEdit || meLoading) return;
    if (!deleteHotelTarget?.id) return;

    setError("");
    setDeletingHotelId(deleteHotelTarget.id);

    try {
      await api.delete(`/admin/hotels/${deleteHotelTarget.id}`, {
        headers: { Authorization: adminAuthHeader },
      });
      await loadHotels();
      closeDeleteModal();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) setError("No autorizado (401). La sesión admin ya no es válida.");
      else if (status === 403) setError("Prohibido (403). No tenés permisos de ADMIN.");
      else {
        const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message ?? String(e);
        setError(msg);
      }
    } finally {
      setDeletingHotelId(null);
    }
  };

  // hotel form
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onFilesChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  };

  // categories ids
  const toggleId = (arr, id) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  const toggleCreateCategory = (id) => setSelectedCategoryIds((prev) => toggleId(prev, id));
  const toggleEditCategory = (id) => setEditCategoryIds((prev) => toggleId(prev, id));

  const cancelEdit = () => {
    setForm(initialForm);
    setFiles([]);
    setSelectedCategoryIds([]);
    setSelectedCharacteristicBools({});
    setSelectedCharacteristicNums({});
    setEditCategoryIds([]);
    setEditCharacteristicBools({});
    setEditCharacteristicNums({});
  };

  // características hoteles
  const saveHotelCharacteristics = async (hotelId, boolMap, numMap) => {
    const payloadArray = [];

    Object.entries(boolMap || {}).forEach(([id, enabled]) => {
      if (enabled === true) payloadArray.push({ characteristicId: Number(id), boolValue: true });
    });

    Object.entries(numMap || {}).forEach(([id, val]) => {
      const n = Number(val);
      if (Number.isFinite(n) && n > 0) payloadArray.push({ characteristicId: Number(id), numValue: n });
    });

    await api.patch(`/admin/hotels/${hotelId}/characteristics`, payloadArray, {
      headers: {
        Authorization: adminAuthHeader,
        "Content-Type": "application/json",
      },
    });
  };

  const startEdit = async (hotel) => {
    if (!canEdit || meLoading) return;
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

      const currentIds = Array.isArray(full?.categories) ? full.categories.map((c) => c?.id).filter(Boolean) : [];
      setEditCategoryIds(currentIds);

      const { bools, nums } = extractHotelCharacteristicState(full);
      setEditCharacteristicBools(bools);
      setEditCharacteristicNums(nums);
      setCharacteristicsStateByHotelId((prev) => ({ ...prev, [hotel.id]: { bools, nums } }));

      const arr = full?.characteristics || full?.characteristicValues || full?.amenities || [];
      setCharacteristicsCountByHotelId((prev) => ({ ...prev, [hotel.id]: Array.isArray(arr) ? arr.length : 0 }));

      setEditImages(Array.isArray(full.imageUrls) ? full.imageUrls : []);
      setFiles([]);
      setIsEditOpen(true);
    } catch (e) {
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message ?? String(e);
      setError(msg);
    }
  };

  const hasBasicHotelChanges = (fullHotel, currentForm) => {
    const a = {
      name: String(fullHotel?.name ?? ""),
      city: String(fullHotel?.city ?? ""),
      address: String(fullHotel?.address ?? ""),
      description: String(fullHotel?.description ?? ""),
    };
    const b = {
      name: String(currentForm?.name ?? ""),
      city: String(currentForm?.city ?? ""),
      address: String(currentForm?.address ?? ""),
      description: String(currentForm?.description ?? ""),
    };
    return a.name !== b.name || a.city !== b.city || a.address !== b.address || a.description !== b.description;
  };

  const saveEditModal = async (e) => {
    e.preventDefault();
    if (!canEdit || meLoading) return;
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
      if (hasBasicHotelChanges(editHotel, payload)) {
        await api.put(`/admin/hotels/${editHotel.id}`, payload, {
          headers: { Authorization: adminAuthHeader },
        });
      }

      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        await api.post(`/admin/hotels/${editHotel.id}/images`, fd, {
          headers: {
            Authorization: adminAuthHeader,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      await api.patch(
        `/hotels/${editHotel.id}/categories`,
        { categoryIds: editCategoryIds },
        { headers: { Authorization: adminAuthHeader } }
      );

      await saveHotelCharacteristics(editHotel.id, editCharacteristicBools, editCharacteristicNums);

      const refreshed = await api.get(`/hotels/${editHotel.id}`);
      setEditHotel(refreshed.data);
      setEditImages(refreshed.data.imageUrls || []);
      setFiles([]);

      const arr =
        refreshed.data?.characteristics || refreshed.data?.characteristicValues || refreshed.data?.amenities || [];
      setCharacteristicsCountByHotelId((prev) => ({ ...prev, [editHotel.id]: Array.isArray(arr) ? arr.length : 0 }));

      const state = extractHotelCharacteristicState(refreshed.data);
      setCharacteristicsStateByHotelId((prev) => ({ ...prev, [editHotel.id]: state }));

      await loadHotels();
      setIsEditOpen(false);
    } catch (e2) {
      const status = e2?.response?.status;
      const msg = e2?.response?.data ? JSON.stringify(e2.response.data) : e2?.message ?? String(e2);
      if (status === 400) setError(`400 Bad Request al guardar.\n\nDetalle: ${msg}`);
      else setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const createHotel = async (e) => {
    e.preventDefault();
    if (!canEdit || meLoading) return;
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
        headers: { Authorization: adminAuthHeader },
      });
      const hotelId = created?.data?.id;

      if (hotelId) {
        await api.patch(
          `/hotels/${hotelId}/categories`,
          { categoryIds: selectedCategoryIds },
          { headers: { Authorization: adminAuthHeader } }
        );
        await saveHotelCharacteristics(hotelId, selectedCharacteristicBools, selectedCharacteristicNums);
      }

      if (hotelId && files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append("files", f));
        await api.post(`/admin/hotels/${hotelId}/images`, fd, {
          headers: {
            Authorization: adminAuthHeader,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setForm(initialForm);
      setFiles([]);
      setSelectedCategoryIds([]);
      setSelectedCharacteristicBools({});
      setSelectedCharacteristicNums({});
      setShowCreate(false);
      await loadHotels();
    } catch (e2) {
      const status = e2?.response?.status;
      const msg = e2?.response?.data ? JSON.stringify(e2.response.data) : e2?.message ?? String(e2);
      if (status === 401) setError("No autorizado (401). La sesión admin ya no es válida.");
      else if (status === 403) setError("Prohibido (403). No tenés permisos de ADMIN.");
      else if (status === 409) setError("Ya existe un hotel con ese nombre. Usá otro nombre.");
      else if (status === 400) setError(`400 Bad Request. Detalle: ${msg}`);
      else setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteImageByUrl = async (hotelId, url) => {
    if (!canEdit || meLoading) return;
    setError("");
    setRemovingUrl(url);

    try {
      await api.delete(`/admin/hotels/${hotelId}/images`, {
        headers: { Authorization: adminAuthHeader },
        params: { url },
      });

      const refreshed = await api.get(`/hotels/${hotelId}`);
      setEditHotel(refreshed.data);
      setEditImages(Array.isArray(refreshed.data.imageUrls) ? refreshed.data.imageUrls : []);
      await loadHotels();
    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data ? JSON.stringify(e.response.data) : e?.message ?? String(e);
      setError(`No se pudo eliminar la imagen. Status: ${status ?? "?"}. ${msg}`);
    } finally {
      setRemovingUrl("");
    }
  };

  // ==========================
  // ADMIN CATEGORIES: SOLO 1 FOTO LOCAL
  // ==========================
  const onCategoryChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm((p) => ({ ...p, [name]: value }));
  };

  const onCategoryFileChange = (e) => {
    const file = (e.target.files && e.target.files[0]) || null;
    setCategoryImageFile(file);
  };

  const resetCategoryForm = () => {
    setCategoryForm(initialCategoryForm);
    setCategoryImageFile(null);
  };

  const createCategory = async (e) => {
    e.preventDefault();
    if (!canEdit || meLoading) return;
    setError("");

    const name = String(categoryForm.name ?? "").trim();
    const slug = String(categoryForm.slug ?? "").trim();
    const description = String(categoryForm.description ?? "").trim();

    if (!name || !slug || !description) {
      setError("Name, Slug y Description son obligatorios.");
      return;
    }
    if (!categoryImageFile) {
      setError("La imagen es obligatoria (1 archivo).");
      return;
    }

    setCategorySubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("slug", slug);
      fd.append("description", description);
      fd.append("imageFile", categoryImageFile);

      await api.post("/categories/with-image", fd, {
        headers: {
          Authorization: adminAuthHeader,
          "Content-Type": "multipart/form-data",
        },
      });

      resetCategoryForm();
      await loadCategories();
      await loadHotels();
    } catch (e2) {
      const status = e2?.response?.status;
      const msg = e2?.response?.data ? JSON.stringify(e2.response.data) : e2?.message ?? String(e2);
      if (status === 409) setError("La categoría ya existe (409).");
      else if (status === 400) setError(`400 Bad Request. Detalle: ${msg}`);
      else if (status === 401) setError("No autorizado (401). La sesión admin ya no es válida.");
      else setError(msg);
    } finally {
      setCategorySubmitting(false);
    }
  };

  const openEditCategory = (c) => {
    if (!canEdit || meLoading) return;
    setError("");
    setEditCategory({
      id: c?.id,
      name: c?.name ?? "",
      slug: c?.slug ?? "",
      description: c?.description ?? "",
      imageUrl: c?.imageUrl ?? "",
    });
    setEditCategoryImageFile(null);
    setIsCategoryEditOpen(true);
  };

  const closeEditCategory = () => {
    setIsCategoryEditOpen(false);
    setEditCategory(null);
    setCategoryEditSubmitting(false);
    setEditCategoryImageFile(null);
  };

  const onEditCategoryChange = (e) => {
    const { name, value } = e.target;
    setEditCategory((p) => ({ ...(p || {}), [name]: value }));
  };

  const onEditCategoryFileChange = (e) => {
    const file = (e.target.files && e.target.files[0]) || null;
    setEditCategoryImageFile(file);
  };

  const saveEditCategory = async (e) => {
    e.preventDefault();
    if (!canEdit || meLoading) return;
    if (!editCategory?.id) return;

    setError("");

    const name = String(editCategory.name ?? "").trim();
    const slug = String(editCategory.slug ?? "").trim();
    const description = String(editCategory.description ?? "").trim();

    if (!name || !slug || !description) {
      setError("Name, Slug y Description son obligatorios.");
      return;
    }

    setCategoryEditSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("slug", slug.toLowerCase());
      fd.append("description", description);

      if (editCategoryImageFile) {
        fd.append("imageFile", editCategoryImageFile);
      }

      await api.put(`/categories/${editCategory.id}/with-image`, fd, {
        headers: {
          Authorization: adminAuthHeader,
          "Content-Type": "multipart/form-data",
        },
      });

      await loadCategories();
      await loadHotels();
      closeEditCategory();
    } catch (e2) {
      const status = e2?.response?.status;
      const msg = e2?.response?.data ? JSON.stringify(e2.response.data) : e2?.message ?? String(e2);
      if (status === 409) setError("No se puede actualizar: conflicto/duplicado (409).");
      else if (status === 400) setError(`400 Bad Request. Detalle: ${msg}`);
      else if (status === 401) setError("No autorizado (401). La sesión admin ya no es válida.");
      else setError(msg);
    } finally {
      setCategoryEditSubmitting(false);
    }
  };

  const deleteCategory = async (c) => {
    if (!canEdit || meLoading) return;
    if (!c?.id) return;

    setError("");
    const ok = window.confirm(`¿Eliminar la categoría "${c.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/categories/${c.id}`, {
        headers: { Authorization: adminAuthHeader },
      });
      await loadCategories();
      await loadHotels();
    } catch (e2) {
      const status = e2?.response?.status;
      const msg = e2?.response?.data ? JSON.stringify(e2.response.data) : e2?.message ?? String(e2);
      if (status === 409) setError("No se puede eliminar: categoría en uso (409).");
      else if (status === 401) setError("No autorizado (401). La sesión admin ya no es válida.");
      else setError(msg);
    }
  };

  const booleanCharacteristics = Array.isArray(characteristics)
    ? characteristics.filter((x) => String(x?.type || "").toUpperCase() === "BOOLEAN")
    : [];

  const numberCharacteristics = Array.isArray(characteristics)
    ? characteristics.filter((x) => String(x?.type || "").toUpperCase() === "NUMBER")
    : [];

  return (
    <>
      <style>{`
        .adminWrap{
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
        }

        .tabsBar {
          display: flex;
          gap: 6px;
          align-items: flex-end;
          border-bottom: 1px solid #d7dbe3;
          margin-top: 10px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .tabsBar::-webkit-scrollbar{ display:none; }

        .tabBtn {
          flex: 0 0 auto;
          appearance: none;
          background: transparent;
          border: 1px solid transparent;
          border-bottom: none;
          padding: 10px 14px;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          color: #1f2a44;
          font-weight: 800;
          cursor: pointer;
          line-height: 1;
          position: relative;
          top: 1px;
          border-radius: 8px 8px 0px 0px;
          white-space: nowrap;
        }
        .tabBtn:hover { background: #f6f8fc; }
        .tabBtnActive {
          background: #ffffff;
          border-color: #d7dbe3;
          border-bottom: 1px solid #ffffff;
          box-shadow: 0 -1px 0 #ffffff inset;
        }

        .tabPanel {
          border: 1px solid #d7dbe3;
          border-top: none;
          background: #ffffff;
          border-bottom-left-radius: 10px;
          border-bottom-right-radius: 10px;
          padding: 14px;
        }

        .tabPanelHeader {
          display: flex;
          justify-content: flex-end;
          align-items: flex-start;
          gap: 10px;
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 1px solid #eef1f6;
        }
        .tabPanelActions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .tableWrap{ overflow-x:auto; }
        .tableWrap table{ min-width: 860px; }

        .badgeWrap{ display:grid; gap:6px; flex-wrap:wrap; }

        .tutelo-modal {
          scrollbar-width: thin;
          scrollbar-color: #c9c9c9 #e8e8e8;
        }
        .tutelo-modal::-webkit-scrollbar { width: 10px; }
        .tutelo-modal::-webkit-scrollbar-track { background: #e8e8e8; border-radius: 999px; }
        .tutelo-modal::-webkit-scrollbar-thumb { background: #c9c9c9; border-radius: 999px; border: 2px solid #e8e8e8; }
        .tutelo-modal::-webkit-scrollbar-thumb:hover { background: #b6b6b6; }

        @media (max-width: 1024px){
          .adminWrap{ padding: 14px; }
          .tabPanel{ padding: 12px; }
          .tableWrap table{ min-width: 920px; }
        }

        @media (max-width: 640px){
          .adminWrap{ padding: 12px; }
          .tabPanel{ padding: 12px; }

          .tabPanelHeader{
            flex-direction: column;
            align-items: stretch;
          }
          .tabPanelActions{
            width: 100%;
            flex-direction: column;
            align-items: stretch;
          }
          .tabPanelActions button{
            width: 100%;
          }

          .grid2Mobile{ grid-template-columns: 1fr !important; }
          .grid3Mobile{ grid-template-columns: 1fr !important; }
          .switchGridMobile{ grid-template-columns: 1fr !important; }

          .tableWrap table{ min-width: 980px; }

          .modalCardWideMobile{
            width: 95vw !important;
            max-height: 88vh !important;
          }
        }
      `}</style>

      <div className="adminWrap">
        <div style={{ display: "flex", justifyContent: "space-between", color: "#232738" }}>
          <h2 style={{ margin: 0 }}>Panel de Administración</h2>
        </div>

        {error && (
          <div
            style={{
              position: "relative",
              background: "rgba(255, 92, 92, 0.8)",
              padding: "12px 40px 12px 12px",
              borderRadius: 10,
              color: "#0b0d12",
              marginTop: 10,
            }}
          >
            <strong>Error:</strong> <span style={{ whiteSpace: "pre-wrap" }}>{error}</span>
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
                color: "#0b0d12",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}

        <div className="tabsBar">
          <button
            type="button"
            className={`tabBtn ${activeTab === "hotels" ? "tabBtnActive" : ""}`}
            onClick={() => setActiveTab("hotels")}
          >
            Hoteles agregados
          </button>

          <button
            type="button"
            className={`tabBtn ${activeTab === "categories" ? "tabBtnActive" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            Categorías agregadas
          </button>
        </div>

        <div className="tabPanel">
          {activeTab === "hotels" ? (
            <>
              <div className="tabPanelHeader">
                <div className="tabPanelActions">
                  <button
                    type="button"
                    onClick={() => setView((v) => (v === "cards" ? "list" : "cards"))}
                    style={btnSecondary}
                  >
                    {view === "cards" ? "Listar productos" : "Cerrar lista"}
                  </button>

                  {canEdit && !meLoading && (
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
                  )}
                </div>
              </div>

              {showCreate && canEdit && (
                <div style={modalOverlay} onClick={() => setShowCreate(false)}>
                  <div
                    className="tutelo-modal modalCardWideMobile"
                    style={modalCardWide}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={modalHeaderSticky}>
                      <h3 style={{ margin: 0, color: "#232738" }}>Registrar hotel</h3>
                      <button
                        type="button"
                        onClick={() => setShowCreate(false)}
                        aria-label="Cerrar"
                        style={modalCloseBtn}
                      >
                        ×
                      </button>
                    </div>

                    <div style={modalBody}>
                      <form ref={createModalFormRef} onSubmit={createHotel} style={{ display: "grid", gap: 12 }}>
                        <div style={grid2} className="grid2Mobile">
                          <Field label="Name *">
                            <input
                              name="name"
                              value={form.name}
                              onChange={onChange}
                              style={input}
                              placeholder="Hotel Central"
                            />
                          </Field>
                          <Field label="City *">
                            <input
                              name="city"
                              value={form.city}
                              onChange={onChange}
                              style={input}
                              placeholder="Buenos Aires"
                            />
                          </Field>
                        </div>

                        <Field label="Address *">
                          <input
                            name="address"
                            value={form.address}
                            onChange={onChange}
                            style={input}
                            placeholder="Calle Falsa 123"
                          />
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

                        <Field label="Categorías (selecciona una o más)">
                          {categories.length === 0 ? (
                            <div style={{ color: "#232738", opacity: 0.8 }}>No hay categorías cargadas.</div>
                          ) : (
                            <div style={switchGrid} className="switchGridMobile">
                              {categories.map((c) => (
                                <Switch
                                  key={c.id}
                                  label={c.name}
                                  checked={selectedCategoryIds.includes(c.id)}
                                  onChange={() => toggleCreateCategory(c.id)}
                                />
                              ))}
                            </div>
                          )}
                        </Field>

                        {Array.isArray(characteristics) && characteristics.length > 0 && (
                          <Field label="Características (comodidades)">
                            {booleanCharacteristics.length > 0 ? (
                              <div style={switchGrid} className="switchGridMobile">
                                {booleanCharacteristics.map((ch) => (
                                  <Switch
                                    key={ch.id}
                                    label={ch.name}
                                    checked={!!selectedCharacteristicBools[ch.id]}
                                    onChange={() =>
                                      setSelectedCharacteristicBools((prev) => ({
                                        ...prev,
                                        [ch.id]: !prev[ch.id],
                                      }))
                                    }
                                  />
                                ))}
                              </div>
                            ) : (
                              <div style={{ color: "#232738", opacity: 0.8 }}>No hay características booleanas.</div>
                            )}

                            {numberCharacteristics.length > 0 && (
                              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                                <strong style={{ color: "#232738" }}>Cantidades</strong>
                                <div style={grid3} className="grid3Mobile">
                                  {numberCharacteristics.map((ch) => (
                                    <Field key={ch.id} label={ch.name}>
                                      <input
                                        type="number"
                                        min="0"
                                        value={Number(selectedCharacteristicNums[ch.id] ?? 0)}
                                        onChange={(e) =>
                                          setSelectedCharacteristicNums((prev) => ({
                                            ...prev,
                                            [ch.id]: Number(e.target.value ?? 0),
                                          }))
                                        }
                                        style={input}
                                      />
                                    </Field>
                                  ))}
                                </div>
                              </div>
                            )}
                          </Field>
                        )}

                        <Field label="Fotos (puedes seleccionar varias)">
                          <input
                            style={{ color: "#232738" }}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={onFilesChange}
                          />
                        </Field>

                        <button type="submit" style={{ display: "none" }} aria-hidden="true" />
                      </form>
                    </div>

                    <div style={modalFooterSticky}>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreate(false);
                          cancelEdit();
                        }}
                        style={btnSecondary}
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        disabled={submitting || !canEdit}
                        style={{
                          ...btnPrimary2,
                          opacity: submitting || !canEdit ? 0.6 : 1,
                          cursor: submitting || !canEdit ? "not-allowed" : "pointer",
                        }}
                        onClick={() => createModalFormRef.current?.requestSubmit()}
                      >
                        {submitting ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {hotelsBoxOpen && (
                <section style={{ ...card, marginTop: 10 }}>
                  <h3 style={{ marginTop: 0, color: "#e8e8e8", display: "flex" }}>Hoteles agregados</h3>

                  {loading ? (
                    <div style={{ color: "#e8e8e8" }}>Cargando…</div>
                  ) : hotels.length === 0 ? (
                    <div style={{ color: "#e8e8e8" }}>No hay hoteles registrados todavía.</div>
                  ) : view === "list" ? (
                    <div className="tableWrap">
                      <table style={table}>
                        <thead>
                          <tr>
                            <th style={th}>ID</th>
                            <th style={th}>Nombre</th>
                            <th style={th}>Fotos</th>
                            <th style={th}>Categorías</th>
                            <th style={th}>Características</th>
                            {canEdit && <th style={th}>Acciones</th>}
                          </tr>
                        </thead>

                        <tbody>
                          {hotels.map((h) => {
                            const urls = imagesByHotelId[h.id] ?? pickHotelImageUrls(h);
                            const cachedCount = characteristicsCountByHotelId[h.id];
                            const st = characteristicsStateByHotelId[h.id];

                            return (
                              <tr key={h.id}>
                                <td style={td}>{h.id}</td>
                                <td style={td}>{h.name}</td>

                                <td style={td}>
                                  {Array.isArray(urls) && urls.length > 0 ? (
                                    <span style={{ fontWeight: 700 }}>+{urls.length}</span>
                                  ) : (
                                    <span style={{ opacity: 0.8 }}>Sin fotos</span>
                                  )}
                                </td>

                                <td style={td}>
                                  {Array.isArray(h?.categories) && h.categories.length > 0 ? (
                                    <div className="badgeWrap">
                                      {h.categories
                                        .filter((c) => c?.name)
                                        .map((c) => (
                                          <span key={c.id ?? c.name} style={badgeStyle} title={c.slug ?? c.name}>
                                            {c.name}
                                          </span>
                                        ))}
                                    </div>
                                  ) : (
                                    <span style={{ opacity: 0.8 }}>Sin categoría</span>
                                  )}
                                </td>

                                <td style={td}>
                                  {st ? (
                                    (() => {
                                      const { bools = {}, nums = {} } = st;
                                      const badges = (Array.isArray(characteristics) ? characteristics : [])
                                        .map((c) => {
                                          const id = c?.id;
                                          const name = c?.name;
                                          const type = String(c?.type || "").toUpperCase();
                                          if (!id || !name) return null;

                                          if (type === "BOOLEAN")
                                            return bools[id] ? (
                                              <span key={`b-${id}`} style={badgeStyle}>
                                                {name}
                                              </span>
                                            ) : null;

                                          if (type === "NUMBER") {
                                            const val = Number(nums[id] ?? 0);
                                            return val > 0 ? (
                                              <span key={`n-${id}`} style={badgeStyle}>
                                                {name}: {val}
                                              </span>
                                            ) : null;
                                          }
                                          return null;
                                        })
                                        .filter(Boolean);

                                      if (badges.length > 0) return <div className="badgeWrap">{badges}</div>;
                                      return <span style={{ opacity: 0.8 }}>{cachedCount ?? 0}</span>;
                                    })()
                                  ) : (
                                    <span style={{ opacity: 0.8 }}>{cachedCount ?? "—"}</span>
                                  )}
                                </td>

                                {canEdit && (
                                  <td style={td}>
                                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                      <button type="button" style={btnSecondary} onClick={() => startEdit(h)}>
                                        Editar
                                      </button>
                                      <button type="button" style={btnDanger} onClick={() => openDeleteModal(h)}>
                                        Eliminar
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ color: "#e8e8e8" }} />
                  )}
                </section>
              )}
            </>
          ) : (
            <>
              <div className="tabPanelHeader">
                <div className="tabPanelActions">
                  <button type="button" onClick={() => setCategoriesBoxOpen((o) => !o)} style={btnSecondary}>
                    {categoriesBoxOpen ? "Cerrar categorías" : "Listar categorías"}
                  </button>

                  {canEdit && !meLoading && (
                    <button type="button" onClick={() => setShowCategoriesAdmin(true)} style={btnPrimary}>
                      Administrar categorías
                    </button>
                  )}
                </div>
              </div>

              {categoriesBoxOpen && (
                <section style={{ ...card, marginTop: 10 }}>
                  <h3 style={{ marginTop: 0, color: "#e8e8e8", display: "flex" }}>Categorías agregadas</h3>

                  {categories.length === 0 ? (
                    <div style={{ color: "#e8e8e8" }}>No hay categorías registradas todavía.</div>
                  ) : (
                    <div className="tableWrap">
                      <table style={table}>
                        <thead>
                          <tr>
                            <th style={th}>ID</th>
                            <th style={th}>Name</th>
                            <th style={th}>Slug</th>
                            <th style={th}>Description</th>
                            <th style={th}>Imagen</th>
                            {canEdit && <th style={th}>Acciones</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map((c) => (
                            <tr key={c.id}>
                              <td style={td}>{c.id}</td>
                              <td style={td}>{c.name}</td>
                              <td style={td}>{c.slug}</td>
                              <td style={td}>{c.description}</td>
                              <td style={td}>
                                {c.imageUrl ? (
                                  <img
                                    src={toAbsoluteImgSrc(c.imageUrl)}
                                    alt={c.name}
                                    style={{
                                      width: 64,
                                      height: 42,
                                      objectFit: "cover",
                                      borderRadius: 10,
                                      border: "1px solid #d9d9d9",
                                    }}
                                  />
                                ) : (
                                  <span style={{ opacity: 0.8 }}>Sin imagen</span>
                                )}
                              </td>
                              {canEdit && (
                                <td style={td}>
                                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    <button type="button" style={btnSecondary} onClick={() => openEditCategory(c)}>
                                      Editar
                                    </button>
                                    <button type="button" style={btnDanger} onClick={() => deleteCategory(c)}>
                                      Eliminar
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>

        {isEditOpen && (
          <div style={modalOverlay} onClick={() => setIsEditOpen(false)}>
            <div
              className="tutelo-modal modalCardWideMobile"
              style={modalCardWide}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={modalHeaderSticky}>
                <h3 style={{ margin: 0, color: "#232738" }}>Editar datos ({editHotel?.name})</h3>
                <button type="button" onClick={() => setIsEditOpen(false)} aria-label="Cerrar" style={modalCloseBtn}>
                  ×
                </button>
              </div>

              <div style={modalBody}>
                <form ref={editModalFormRef} onSubmit={saveEditModal} style={{ display: "grid", gap: 12 }}>
                  <input name="name" value={form.name} onChange={onChange} style={input} />
                  <input name="city" value={form.city} onChange={onChange} style={input} />
                  <input name="address" value={form.address} onChange={onChange} style={input} />

                  <textarea name="description" value={form.description} onChange={onChange} style={{ ...input, minHeight: 80 }} />

                  <Field label="Categorías">
                    {categories.length === 0 ? (
                      <div style={{ color: "#232738", opacity: 0.8 }}>No hay categorías cargadas.</div>
                    ) : (
                      <div style={switchGrid} className="switchGridMobile">
                        {categories.map((c) => (
                          <Switch
                            key={c.id}
                            label={c.name}
                            checked={editCategoryIds.includes(c.id)}
                            onChange={() => toggleEditCategory(c.id)}
                            disabled={!canEdit || meLoading}
                          />
                        ))}
                      </div>
                    )}
                  </Field>

                  {Array.isArray(characteristics) && characteristics.length > 0 && (
                    <Field label="Características (comodidades)">
                      {booleanCharacteristics.length > 0 ? (
                        <div style={switchGrid} className="switchGridMobile">
                          {booleanCharacteristics.map((ch) => (
                            <Switch
                              key={ch.id}
                              label={ch.name}
                              checked={!!editCharacteristicBools[ch.id]}
                              onChange={() => setEditCharacteristicBools((prev) => ({ ...prev, [ch.id]: !prev[ch.id] }))}
                              disabled={!canEdit || meLoading}
                            />
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: "#232738", opacity: 0.8 }}>No hay características booleanas.</div>
                      )}

                      {numberCharacteristics.length > 0 && (
                        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                          <strong style={{ color: "#232738" }}>Cantidades</strong>
                          <div style={grid3} className="grid3Mobile">
                            {numberCharacteristics.map((ch) => (
                              <Field key={ch.id} label={ch.name}>
                                <input
                                  type="number"
                                  min="0"
                                  value={Number(editCharacteristicNums[ch.id] ?? 0)}
                                  onChange={(e) =>
                                    setEditCharacteristicNums((prev) => ({ ...prev, [ch.id]: Number(e.target.value ?? 0) }))
                                  }
                                  style={input}
                                  disabled={!canEdit || meLoading}
                                />
                              </Field>
                            ))}
                          </div>
                        </div>
                      )}
                    </Field>
                  )}

                  <strong style={{ color: "#232738" }}>Fotos actuales ({editImages.length})</strong>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {editImages.map((u) => (
                      <div key={u} style={imageWrap}>
                        <img src={toAbsoluteImgSrc(u)} alt="Hotel" style={imageThumb} />
                        <button
                          type="button"
                          disabled={!canEdit || meLoading || !canDeleteImages || removingUrl === u}
                          onClick={() => {
                            if (!canEdit || meLoading) return;
                            if (!canDeleteImages) return;
                            deleteImageByUrl(editHotel.id, u);
                          }}
                          style={{
                            ...removeCircle,
                            opacity: !canEdit || meLoading || !canDeleteImages || removingUrl === u ? 0.5 : 1,
                            cursor: !canEdit || meLoading || !canDeleteImages || removingUrl === u ? "not-allowed" : "pointer",
                          }}
                          title="Eliminar imagen"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <input
                    style={{ color: "#232738" }}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={onFilesChange}
                    disabled={!canEdit || meLoading}
                  />
                  <button type="submit" style={{ display: "none" }} aria-hidden="true" />
                </form>
              </div>

              <div style={modalFooterSticky}>
                <button type="button" style={btnSecondary} onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </button>

                <button
                  type="button"
                  style={{
                    ...btnPrimary2,
                    opacity: !canEdit || meLoading ? 0.6 : 1,
                    cursor: !canEdit || meLoading ? "not-allowed" : "pointer",
                  }}
                  disabled={!canEdit || meLoading || submitting}
                  onClick={() => editModalFormRef.current?.requestSubmit()}
                >
                  {submitting ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isDeleteOpen && (
          <div style={modalOverlay} onClick={closeDeleteModal}>
            <div className="tutelo-modal modalCardWideMobile" style={modalCardWide} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderSticky}>
                <h3 style={{ margin: 0, color: "#232738" }}>Confirmar eliminación</h3>
                <button type="button" onClick={closeDeleteModal} aria-label="Cerrar" style={modalCloseBtn}>
                  ×
                </button>
              </div>

              <div style={modalBody}>
                <div style={{ color: "#232738", display: "grid", gap: 10 }}>
                  <p style={{ margin: 0 }}>
                    ¿Eliminar <strong>{deleteHotelTarget?.name}</strong> (ID: <strong>{deleteHotelTarget?.id}</strong>)?
                  </p>
                  <p style={{ margin: 0, opacity: 0.85 }}>Esta acción no se puede deshacer.</p>
                </div>
              </div>

              <div style={modalFooterSticky}>
                <button type="button" style={btnSecondary} onClick={closeDeleteModal}>
                  Cancelar
                </button>

                <button
                  type="button"
                  style={{
                    ...btnPrimary2,
                    opacity: deletingHotelId || !canEdit || meLoading ? 0.7 : 1,
                    cursor: deletingHotelId || !canEdit || meLoading ? "not-allowed" : "pointer",
                  }}
                  disabled={!!deletingHotelId || !canEdit || meLoading}
                  onClick={confirmDeleteHotel}
                >
                  {deletingHotelId ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showCategoriesAdmin && (
          <div style={modalOverlay} onClick={() => setShowCategoriesAdmin(false)}>
            <div className="tutelo-modal modalCardWideMobile" style={modalCardWide} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderSticky}>
                <h3 style={{ margin: 0, color: "#232738" }}>Administrar categorías</h3>
                <button type="button" onClick={() => setShowCategoriesAdmin(false)} aria-label="Cerrar" style={modalCloseBtn}>
                  ×
                </button>
              </div>

              <div style={modalBody}>
                <form ref={categoryCreateFormRef} onSubmit={createCategory} style={{ display: "grid", gap: 12 }}>
                  <div style={grid2} className="grid2Mobile">
                    <Field label="Name *">
                      <input name="name" value={categoryForm.name} onChange={onCategoryChange} style={input} />
                    </Field>
                    <Field label="Slug *">
                      <input name="slug" value={categoryForm.slug} onChange={onCategoryChange} style={input} />
                    </Field>
                  </div>

                  <Field label="Description *">
                    <textarea
                      name="description"
                      value={categoryForm.description}
                      onChange={onCategoryChange}
                      style={{ ...input, minHeight: 80, resize: "vertical" }}
                    />
                  </Field>

                  <Field label="Imagen de la categoría (1 archivo) *">
                    <input type="file" accept="image/*" onChange={onCategoryFileChange} style={{ color: "#232738" }} />
                    {categoryImageFile && (
                      <div style={{ fontSize: 12, color: "#232738", opacity: 0.85 }}>
                        Seleccionado: <strong>{categoryImageFile.name}</strong>
                      </div>
                    )}
                  </Field>

                  <button type="submit" style={{ display: "none" }} aria-hidden="true" />
                </form>
              </div>

              <div style={modalFooterSticky}>
                <button type="button" style={btnSecondary} onClick={resetCategoryForm}>
                  Limpiar
                </button>

                <button
                  type="button"
                  style={{
                    ...btnPrimary2,
                    opacity: categorySubmitting ? 0.65 : 1,
                    cursor: categorySubmitting ? "not-allowed" : "pointer",
                  }}
                  disabled={categorySubmitting}
                  onClick={() => categoryCreateFormRef.current?.requestSubmit()}
                >
                  {categorySubmitting ? "Creando..." : "Crear categoría"}
                </button>

                <button type="button" style={btnSecondary} onClick={() => setShowCategoriesAdmin(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {isCategoryEditOpen && editCategory && (
          <div style={modalOverlay} onClick={closeEditCategory}>
            <div className="tutelo-modal modalCardWideMobile" style={modalCardWide} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderSticky}>
                <h3 style={{ margin: 0, color: "#232738" }}>Editar categoría ({editCategory?.name})</h3>
                <button type="button" onClick={closeEditCategory} aria-label="Cerrar" style={modalCloseBtn}>
                  ×
                </button>
              </div>

              <div style={modalBody}>
                <form ref={categoryEditFormRef} onSubmit={saveEditCategory} style={{ display: "grid", gap: 12 }}>
                  <div style={grid2} className="grid2Mobile">
                    <Field label="Name *">
                      <input name="name" value={editCategory.name} onChange={onEditCategoryChange} style={input} />
                    </Field>
                    <Field label="Slug *">
                      <input name="slug" value={editCategory.slug} onChange={onEditCategoryChange} style={input} />
                    </Field>
                  </div>

                  <Field label="Description *">
                    <textarea
                      name="description"
                      value={editCategory.description}
                      onChange={onEditCategoryChange}
                      style={{ ...input, minHeight: 80, resize: "vertical" }}
                    />
                  </Field>

                  {editCategory.imageUrl ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "#232738", fontWeight: 800 }}>Imagen actual</span>
                      <img
                        src={toAbsoluteImgSrc(editCategory.imageUrl)}
                        alt={editCategory.name}
                        style={{
                          width: 160,
                          height: 110,
                          objectFit: "cover",
                          borderRadius: 12,
                          border: "1px solid #d9d9d9",
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{ color: "#232738", opacity: 0.8 }}>Esta categoría no tiene imagen. Subí una.</div>
                  )}

                  <Field label="Reemplazar imagen (1 archivo)">
                    <input type="file" accept="image/*" onChange={onEditCategoryFileChange} style={{ color: "#232738" }} />
                    {editCategoryImageFile && (
                      <div style={{ fontSize: 12, color: "#232738", opacity: 0.85 }}>
                        Nuevo archivo: <strong>{editCategoryImageFile.name}</strong>
                      </div>
                    )}
                  </Field>

                  <button type="submit" style={{ display: "none" }} aria-hidden="true" />
                </form>
              </div>

              <div style={modalFooterSticky}>
                <button type="button" style={btnSecondary} onClick={closeEditCategory}>
                  Cancelar
                </button>

                <button
                  type="button"
                  style={{
                    ...btnPrimary2,
                    opacity: !canEdit || meLoading || categoryEditSubmitting ? 0.6 : 1,
                    cursor: !canEdit || meLoading || categoryEditSubmitting ? "not-allowed" : "pointer",
                  }}
                  disabled={!canEdit || meLoading || categoryEditSubmitting}
                  onClick={() => categoryEditFormRef.current?.requestSubmit()}
                >
                  {categoryEditSubmitting ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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

function Switch({ label, checked, onChange, disabled }) {
  return (
    <label style={switchWrap}>
      <span style={{ color: "#232738", fontWeight: 800, fontSize: 13 }}>{label}</span>

      <span style={{ position: "relative", width: 46, height: 26, display: "inline-block" }}>
        <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} style={switchInput} />

        <span
          style={{
            ...switchTrack,
            opacity: disabled ? 0.6 : 1,
            background: checked ? "#22c55e" : "#c9c9c9",
            transition: "background 140ms ease",
          }}
        />

        <span
          style={{
            ...switchThumb,
            transform: checked ? "translateX(20px)" : "translateX(0px)",
            background: checked ? "#ffffff" : "#2b3150",
            transition: "transform 140ms ease, background 140ms ease",
          }}
        />
      </span>
    </label>
  );
}

const card = { background: "#2d66f5", border: "1px solid #2d66f5", borderRadius: 16, padding: 16 };
const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 };
const grid3 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 };

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
  background: "#2d66f5",
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

const table = { width: "100%", borderCollapse: "collapse", background: "#ffffff", borderRadius: 12, overflow: "hidden" };
const th = { textAlign: "left", padding: "12px 14px", background: "#2b3150", color: "#e8e8e8", fontSize: 13, letterSpacing: 0.4 };
const td = { padding: "12px 14px", borderBottom: "1px solid #e6e6e6", color: "#0b0d12", fontSize: 14 };

const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 9999 };

const modalCardWide = {
  background: "#ffffff",
  borderRadius: 18,
  width: "min(980px, 95%)",
  maxHeight: "min(85vh, 900px)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
};

const switchGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 };

const switchWrap = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #d9d9d9",
  background: "rgba(247, 249, 249, 0.91)",
};

const switchInput = { position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2 };
const switchTrack = { position: "absolute", inset: 0, borderRadius: 999, background: "#c9c9c9" };
const switchThumb = { position: "absolute", top: 3, left: 3, width: 20, height: 20, borderRadius: "50%", background: "#2b3150", transition: "transform 140ms ease" };

const imageWrap = { position: "relative", width: 140, height: 90 };
const imageThumb = { width: "100%", height: "100%", objectFit: "cover", borderRadius: 12, border: "1px solid #d9d9d9" };

const removeCircle = {
  position: "absolute",
  top: -8,
  right: -8,
  width: 36,
  height: 43,
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

const modalCloseBtn = {
  width: 36,
  height: 52,
  borderRadius: "50%",
  background: "#ffffff",
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

const modalHeaderSticky = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 16px",
  color: "#232738",
  background: "#ffffff",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  position: "sticky",
  top: 0,
  zIndex: 2,
};

const modalBody = { padding: 16, overflowY: "auto", flex: 1 };

const modalFooterSticky = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  padding: "14px 16px",
  background: "#ffffff",
  borderTop: "1px solid rgba(0,0,0,0.08)",
  position: "sticky",
  bottom: 0,
  zIndex: 2,
};

const badgeStyle = {
  background: "#e8e8e8",
  border: "1px solid #d9d9d9",
  padding: "3px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};