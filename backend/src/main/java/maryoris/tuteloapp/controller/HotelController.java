package maryoris.tuteloapp.controller;

import jakarta.validation.Valid;
import maryoris.tuteloapp.dto.HotelRequest;
import maryoris.tuteloapp.entity.HotelEntity;
import maryoris.tuteloapp.repository.HotelRepository;
import maryoris.tuteloapp.service.HotelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.*;

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
    private final HotelRepository hotelRepository;

    public HotelController(HotelService service, HotelRepository hotelRepository) {
        this.service = service;
        this.hotelRepository = hotelRepository;
    }

    @PostMapping
    public HotelEntity create(@Valid @RequestBody HotelRequest req) {
        return service.create(req);
    }

    @GetMapping
    public List<HotelEntity> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HotelEntity> getById(@PathVariable Long id) {
        return hotelRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<HotelEntity> updateHotel(
            @PathVariable Long id,
            @Valid @RequestBody HotelRequest req
    ) {
        HotelEntity updated = service.update(id, req);
        return ResponseEntity.ok(updated);
    }

    // Upload multiple images
    @PostMapping("/{id}/images")
    public ResponseEntity<?> uploadHotelImages(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files
    ) throws Exception {

        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No se enviaron archivos"));
        }

        var hotelOpt = hotelRepository.findById(id);
        if (hotelOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        var hotel = hotelOpt.get();

        Path uploadDir = Paths.get("uploads");
        Files.createDirectories(uploadDir);

        List<String> urls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String original = Optional.ofNullable(file.getOriginalFilename()).orElse("file");
            String ext = "";
            int dot = original.lastIndexOf('.');
            if (dot >= 0) ext = original.substring(dot);

            String filename = UUID.randomUUID() + ext;
            Path target = uploadDir.resolve(filename);

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            urls.add("/uploads/" + filename);
        }

        if (hotel.getImageUrls() == null) {
            hotel.setImageUrls(new ArrayList<>());
        }
        hotel.getImageUrls().addAll(urls);
        hotelRepository.save(hotel);

        return ResponseEntity.ok(Map.of("imageUrls", urls));
    }

    // DELETE imagen (ADMIN)
    // Ruta REAL: DELETE /api/hotels/admin/hotels/{id}/images?url=...
    @DeleteMapping("/admin/hotels/{id}/images")
    public ResponseEntity<Void> deleteHotelImage(
            @PathVariable Long id,
            @RequestParam String url
    ) {
        String decoded = java.net.URLDecoder.decode(url, java.nio.charset.StandardCharsets.UTF_8);
        service.deleteImageByUrl(id, decoded);
        return ResponseEntity.noContent().build();
    }
}

