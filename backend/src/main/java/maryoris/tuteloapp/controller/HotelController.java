package maryoris.tuteloapp.controller;

import jakarta.validation.Valid;
import maryoris.tuteloapp.dto.HotelPublicResponse;
import maryoris.tuteloapp.dto.HotelRequest;
import maryoris.tuteloapp.dto.UpdateHotelCategoriesRequest;
import maryoris.tuteloapp.entity.HotelEntity;
import maryoris.tuteloapp.service.HotelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@CrossOrigin(
        origins = {
                "http://localhost:5182",
                "http://localhost:5177",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:5176",
                "http://localhost:5178",
                "http://localhost:5179",
                "http://localhost:5180",
                "http://localhost:5181",
                "http://localhost:5183"
        }
)
@RestController
@RequestMapping("/api/hotels")
public class HotelController {

    private final HotelService service;

    public HotelController(HotelService service) {
        this.service = service;
    }

    @PostMapping
    public HotelEntity create(@Valid @RequestBody HotelRequest req) {
        return service.create(req);
    }

    @GetMapping
    public List<HotelPublicResponse> list() {
        return service.listPublic();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HotelEntity> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HotelEntity> updateHotel(
            @PathVariable Long id,
            @Valid @RequestBody HotelRequest req
    ) {
        HotelEntity updated = service.update(id, req);
        return ResponseEntity.ok(updated);
    }

    /*
     * CORRECCIÓN - Punto 5: Arquitectura del HotelController
     * El controller deja de crear directorios, copiar archivos o generar UUIDs.
     * Solo recibe la request HTTP y delega el almacenamiento de imágenes al service.
     */
    @PostMapping("/{id}/images")
    public ResponseEntity<?> uploadHotelImages(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files
    ) {
        List<String> urls = service.uploadImages(id, files);
        return ResponseEntity.ok(Map.of("imageUrls", urls));
    }

    /*
     * CORRECCIÓN - Punto 5: Arquitectura del HotelController
     * El controller delega la eliminación de imágenes al service y se mantiene
     * enfocado únicamente en la capa HTTP.
     */
    @DeleteMapping("/admin/hotels/{id}/images")
    public ResponseEntity<Void> deleteHotelImage(
            @PathVariable Long id,
            @RequestParam String url
    ) {
        service.deleteImageByUrl(id, url);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/categories")
    public HotelEntity updateCategories(
            @PathVariable Long id,
            @Valid @RequestBody UpdateHotelCategoriesRequest req
    ) {
        return service.updateCategories(id, req.getCategoryIds());
    }
}
