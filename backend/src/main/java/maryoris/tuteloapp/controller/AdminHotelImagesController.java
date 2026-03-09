package maryoris.tuteloapp.controller;

import maryoris.tuteloapp.service.HotelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/hotels")
public class AdminHotelImagesController {

    private final HotelService hotelService;

    public AdminHotelImagesController(HotelService hotelService) {
        this.hotelService = hotelService;
    }

    /*
     * CORRECCIÓN - Punto 5: Arquitectura del HotelController
     * Este controller administrativo deja de contener lógica de filesystem
     * y delega completamente el upload de imágenes al HotelService.
     */
    @PostMapping("/{id}/images")
    public ResponseEntity<?> uploadHotelImages(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files
    ) {
        List<String> urls = hotelService.uploadImages(id, files);
        return ResponseEntity.ok(Map.of("imageUrls", urls));
    }

    /*
     * CORRECCIÓN - Punto 5: Arquitectura del HotelController
     * La eliminación de imágenes se delega al service para evitar mezclar
     * lógica de negocio e infraestructura dentro del controller.
     */
    @DeleteMapping("/{id}/images")
    public ResponseEntity<Void> deleteHotelImage(
            @PathVariable Long id,
            @RequestParam("url") String url
    ) {
        hotelService.deleteImageByUrl(id, url);
        return ResponseEntity.noContent().build();
    }
}