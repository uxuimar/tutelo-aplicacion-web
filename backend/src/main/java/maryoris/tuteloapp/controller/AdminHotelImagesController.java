package maryoris.tuteloapp.controller;

import maryoris.tuteloapp.repository.HotelRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/admin/hotels")
public class AdminHotelImagesController {

    private final HotelRepository hotelRepository;

    public AdminHotelImagesController(HotelRepository hotelRepository) {
        this.hotelRepository = hotelRepository;
    }

    // ✅ Upload multiple images (ADMIN)
    @PostMapping("/{id}/images")
    public ResponseEntity<?> uploadHotelImages(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files
    ) {
        try {
            if (files == null || files.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "No se enviaron archivos"));
            }

            var hotelOpt = hotelRepository.findById(id);
            if (hotelOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            var hotel = hotelOpt.get();

            // ✅ Ruta absoluta al directorio uploads
            Path uploadDir = Paths.get(System.getProperty("user.dir"), "uploads");
            Files.createDirectories(uploadDir);

            List<String> urls = new ArrayList<>();

            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;

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

            return ResponseEntity.ok(Map.of(
                    "uploadDir", uploadDir.toString(),
                    "imageUrls", urls
            ));

        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Error guardando imágenes",
                    "error", ex.getClass().getName(),
                    "detail", String.valueOf(ex.getMessage())
            ));
        }
    }

    // ✅ Delete 1 image (ADMIN)
    // Ruta: DELETE /api/admin/hotels/{id}/images?url=/uploads/xxx.jpg
    @DeleteMapping("/{id}/images")
    public ResponseEntity<?> deleteHotelImage(
            @PathVariable Long id,
            @RequestParam("url") String url
    ) {
        try {
            var hotelOpt = hotelRepository.findById(id);
            if (hotelOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            var hotel = hotelOpt.get();

            if (hotel.getImageUrls() == null || hotel.getImageUrls().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "El hotel no tiene imágenes"));
            }

            // Por si viene URL encodeada
            String decoded = URLDecoder.decode(url, StandardCharsets.UTF_8);

            // 1) quitar de DB
            boolean removed = hotel.getImageUrls().removeIf(u -> Objects.equals(u, decoded));
            if (!removed) {
                return ResponseEntity.status(404).body(Map.of(
                        "message", "La imagen no está asociada a este hotel",
                        "url", decoded
                ));
            }

            hotelRepository.save(hotel);

            // 2) borrar archivo físico (si existe)
            // decoded esperado: "/uploads/filename.jpg"
            String filename = decoded.replace("\\", "/");
            if (filename.startsWith("/uploads/")) {
                filename = filename.substring("/uploads/".length());
            } else if (filename.startsWith("uploads/")) {
                filename = filename.substring("uploads/".length());
            }

            Path uploadDir = Paths.get(System.getProperty("user.dir"), "uploads");
            Path filePath = uploadDir.resolve(filename).normalize();

            // seguridad básica: evitar path traversal
            if (!filePath.startsWith(uploadDir.normalize())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Ruta inválida"));
            }

            Files.deleteIfExists(filePath);

            return ResponseEntity.noContent().build();

        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Error eliminando imagen",
                    "error", ex.getClass().getName(),
                    "detail", String.valueOf(ex.getMessage())
            ));
        }
    }
}

