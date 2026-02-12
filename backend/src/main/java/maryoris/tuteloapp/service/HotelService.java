package maryoris.tuteloapp.service;

import maryoris.tuteloapp.dto.HotelRequest;
import maryoris.tuteloapp.entity.HotelEntity;
import maryoris.tuteloapp.repository.HotelRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
public class HotelService {

    private final HotelRepository hotelRepository;

    public HotelService(HotelRepository hotelRepository) {
        this.hotelRepository = hotelRepository;
    }

    // Create usando DTO, reutiliza TODA tu lógica y mensajes
    public HotelEntity create(HotelRequest req) {
        HotelEntity hotel = new HotelEntity();
        hotel.setName(req.getName());
        hotel.setCity(req.getCity());
        hotel.setAddress(req.getAddress());
        hotel.setDescription(req.getDescription());
        return create(hotel); // 🔁 reutiliza tu create(HotelEntity) intacto
    }

    // Tu create original se mantiene
    public HotelEntity create(HotelEntity hotel) {

        String name = hotel.getName() == null ? null : hotel.getName().trim();
        String city = hotel.getCity() == null ? null : hotel.getCity().trim();
        String address = hotel.getAddress() == null ? null : hotel.getAddress().trim();

        if (name == null || name.isBlank()
                || city == null || city.isBlank()
                || address == null || address.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nombre, Ciudad y Dirección son obligatorios"
            );
        }

        if (hotelRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un hotel con ese nombre"
            );
        }

        hotel.setName(name);
        hotel.setCity(city);
        hotel.setAddress(address);

        try {
            return hotelRepository.save(hotel);
        } catch (DataIntegrityViolationException ex) {
            // Backup por si el constraint de DB dispara
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un hotel con ese nombre"
            );
        }
    }

    public List<HotelEntity> list() {
        return hotelRepository.findAll();
    }

    public void delete(Long id) {
        if (!hotelRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel no existe");
        }
        hotelRepository.deleteById(id);
    }

    // Para que el PUT funcione
    public HotelEntity update(Long id, HotelRequest req) {
        HotelEntity h = hotelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel no existe"));

        h.setName(req.getName());
        h.setCity(req.getCity());
        h.setAddress(req.getAddress());
        h.setDescription(req.getDescription());

        return hotelRepository.save(h);
    }

    // ✅ NUEVO: elimina una imagen por URL (quita de DB y borra el archivo si existe)
    public void deleteImageByUrl(Long hotelId, String url) {
        HotelEntity hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel no existe"));

        if (hotel.getImageUrls() == null || hotel.getImageUrls().isEmpty()) return;

        boolean removed = hotel.getImageUrls().removeIf(u -> u != null && u.equals(url));
        if (removed) {
            hotelRepository.save(hotel);
        }

        // Borrar archivo físico si está en /uploads/...
        try {
            if (url != null && url.startsWith("/uploads/")) {
                String filename = url.replaceFirst("^/uploads/", "");
                Path filePath = Paths.get("uploads").resolve(filename).normalize();
                Files.deleteIfExists(filePath);
            }
        } catch (Exception ignored) {
            // no rompemos nada si falla el delete del archivo
        }
    }
}

