package maryoris.tuteloapp.controller;

import maryoris.tuteloapp.entity.CategoryEntity;
import maryoris.tuteloapp.repository.CategoryRepository;
import maryoris.tuteloapp.service.FileStorageService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository repo;
    private final FileStorageService storage;

    public CategoryController(CategoryRepository repo, FileStorageService storage) {
        this.repo = repo;
        this.storage = storage;
    }

    // ===============================
    // ✅ LISTAR (para el panel admin y sitio)
    // GET /api/categories
    // ===============================
    @GetMapping
    public List<CategoryEntity> list() {
        return repo.findAll();
    }

    // ===============================
    // ✅ OBTENER 1
    // GET /api/categories/{id}
    // ===============================
    @GetMapping("/{id}")
    public CategoryEntity getById(@PathVariable Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoría no encontrada"));
    }

    @GetMapping("/{id}/usage")
    public java.util.Map<String, Object> usage(@PathVariable Long id) {
        long count = repo.countHotelsUsingCategory(id);
        return java.util.Map.of("categoryId", id, "hotelsCount", count);
    }

    // ===============================
    // ✅ CREAR CON IMAGEN (multipart)
    // POST /api/categories/with-image
    // ===============================
    @PostMapping(value = "/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CategoryEntity createWithImage(
            @RequestPart("name") String name,
            @RequestPart("slug") String slug,
            @RequestPart("description") String description,
            @RequestPart("imageFile") MultipartFile imageFile
    ) throws Exception {

        try {
            String imageUrl = storage.saveCategoryImage(imageFile);

            CategoryEntity category = new CategoryEntity();
            category.setName(name.trim());
            category.setSlug(slug.trim().toLowerCase());
            category.setDescription(description.trim());
            category.setImageUrl(imageUrl);

            return repo.save(category);

        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Categoría duplicada (name/slug)", ex);
        }
    }

    // ===============================
    // ✅ EDITAR CON IMAGEN (multipart, image opcional)
    // PUT /api/categories/{id}/with-image
    // ===============================
    @PutMapping(value = "/{id}/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CategoryEntity updateWithImage(
            @PathVariable Long id,
            @RequestPart("name") String name,
            @RequestPart("slug") String slug,
            @RequestPart("description") String description,
            @RequestPart(value = "imageFile", required = false) MultipartFile imageFile
    ) throws Exception {

        CategoryEntity existing = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoría no encontrada"));

        existing.setName(name.trim());
        existing.setSlug(slug.trim().toLowerCase());
        existing.setDescription(description.trim());

        // ✅ si viene archivo, reemplaza imagen
        if (imageFile != null && !imageFile.isEmpty()) {
            String imageUrl = storage.saveCategoryImage(imageFile);
            existing.setImageUrl(imageUrl);
        }

        try {
            return repo.save(existing);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Conflicto (slug duplicado)", ex);
        }
    }

    // ===============================
    // ✅ EDITAR SIN IMAGEN (JSON)
    // PUT /api/categories/{id}
    // (esto te evita depender 100% de multipart)
    // ===============================
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public CategoryEntity updateJson(@PathVariable Long id, @RequestBody CategoryEntity body) {

        CategoryEntity existing = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoría no encontrada"));

        String name = body.getName() == null ? "" : body.getName().trim();
        String slug = body.getSlug() == null ? "" : body.getSlug().trim().toLowerCase();
        String description = body.getDescription() == null ? "" : body.getDescription().trim();
        String imageUrl = body.getImageUrl() == null ? "" : body.getImageUrl().trim();

        if (name.isEmpty() || slug.isEmpty() || description.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name/Slug/Description son obligatorios");
        }
        if (imageUrl.isEmpty() && (existing.getImageUrl() == null || existing.getImageUrl().trim().isEmpty())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La categoría debe tener imageUrl o subir imagen");
        }

        existing.setName(name);
        existing.setSlug(slug);
        existing.setDescription(description);

        // si mandan imageUrl, actualiza; si no, conserva
        if (!imageUrl.isEmpty()) {
            existing.setImageUrl(imageUrl);
        }

        try {
            return repo.save(existing);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Conflicto (slug duplicado)", ex);
        }
    }

    // ===============================
    // ✅ ELIMINAR
    // DELETE /api/categories/{id}
    // ===============================
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoría no encontrada");
        }
        try {
            repo.deleteById(id);
        } catch (DataIntegrityViolationException ex) {
            // por FK en hoteles/categorías, etc.
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede eliminar: categoría en uso", ex);
        }
    }
}