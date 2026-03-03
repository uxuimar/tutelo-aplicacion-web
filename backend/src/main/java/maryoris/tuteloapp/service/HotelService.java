package maryoris.tuteloapp.service;

import maryoris.tuteloapp.dto.HotelRequest;
import maryoris.tuteloapp.dto.HotelCharacteristicValueRequest;
import maryoris.tuteloapp.entity.CategoryEntity;
import maryoris.tuteloapp.entity.CharacteristicEntity;
import maryoris.tuteloapp.entity.HotelCharacteristicEntity;
import maryoris.tuteloapp.entity.HotelEntity;
import maryoris.tuteloapp.repository.CategoryRepository;
import maryoris.tuteloapp.repository.CharacteristicRepository;
import maryoris.tuteloapp.repository.HotelCharacteristicRepository;
import maryoris.tuteloapp.repository.HotelRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

import maryoris.tuteloapp.dto.CategoryResponse;
import maryoris.tuteloapp.dto.HotelPublicResponse;


@Service
public class HotelService {

    private final HotelRepository hotelRepository;
    private final CategoryRepository categoryRepository;
    private final CharacteristicRepository characteristicRepository;
    private final HotelCharacteristicRepository hotelCharacteristicRepository;

    public HotelService(
            HotelRepository hotelRepository,
            CategoryRepository categoryRepository,
            CharacteristicRepository characteristicRepository,
            HotelCharacteristicRepository hotelCharacteristicRepository
    ) {
        this.hotelRepository = hotelRepository;
        this.categoryRepository = categoryRepository;
        this.characteristicRepository = characteristicRepository;
        this.hotelCharacteristicRepository = hotelCharacteristicRepository;
    }

    // Create usando DTO, reutiliza lógica y mensajes
    public HotelEntity create(HotelRequest req) {
        HotelEntity hotel = new HotelEntity();
        hotel.setName(req.getName());
        hotel.setCity(req.getCity());
        hotel.setAddress(req.getAddress());
        hotel.setDescription(req.getDescription());

        // Si vienen características, las aplicamos antes del save (cascade)
        applyCharacteristics(hotel, req.getCharacteristics());

        return create(hotel); // reutiliza tu create(HotelEntity) intacto
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

    // Para que el PUT funcione (se mantiene igual, pero ahora soporta characteristics)
    public HotelEntity update(Long id, HotelRequest req) {
        HotelEntity h = hotelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel no existe"));

        h.setName(req.getName());
        h.setCity(req.getCity());
        h.setAddress(req.getAddress());
        h.setDescription(req.getDescription());

        // - Si req.getCharacteristics() == null => no toca nada (no rompe front actual)
        // - Si viene lista vacía => limpia todas
        applyCharacteristics(h, req.getCharacteristics());

        return hotelRepository.save(h);
    }

    // Asigna/actualiza categorías a un hotel existente (sin cambios)
    public HotelEntity updateCategories(Long hotelId, List<Long> categoryIds) {

        if (categoryIds == null || categoryIds.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Debe seleccionar al menos una categoría");
        }

        HotelEntity hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel no existe"));

        List<CategoryEntity> found = categoryRepository.findAllById(categoryIds);

        if (found.size() != categoryIds.size()) {
            Set<Long> foundIds = found.stream().map(CategoryEntity::getId).collect(Collectors.toSet());
            List<Long> missing = categoryIds.stream()
                    .filter(cid -> !foundIds.contains(cid))
                    .collect(Collectors.toList());

            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Categorías no encontradas: " + missing);
        }

        hotel.setCategories(new HashSet<>(found));
        return hotelRepository.save(hotel);
    }

    public List<HotelPublicResponse> listPublic() {
        List<HotelEntity> hotels = hotelRepository.findAllWithCategories();

        return hotels.stream().map(h -> {
            HotelPublicResponse dto = new HotelPublicResponse();
            dto.setId(h.getId());
            dto.setName(h.getName());
            dto.setCity(h.getCity());
            dto.setAddress(h.getAddress());
            dto.setDescription(h.getDescription());
            dto.setImageUrls(h.getImageUrls());

            dto.setCategories(
                    h.getCategories().stream()
                            .map(c -> new CategoryResponse(c.getId(), c.getName()))
                            .toList()
            );

            return dto;
        }).toList();
    }

    // PATCH de characteristics
    // FIX DEFINITIVO: permite "encender" muchas y también "apagar" (payload vacío limpia todo)
    // FIX 500: el delete+insert se hace en 1 transacción y con flush para evitar unique constraint
    @Transactional
    public HotelEntity updateCharacteristics(Long hotelId, List<HotelCharacteristicValueRequest> requests) {

        HotelEntity hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel no existe"));

        // IMPORTANTÍSIMO: sincronizar el estado en memoria
        if (hotel.getCharacteristics() == null) {
            hotel.setCharacteristics(new ArrayList<>());
        } else {
            hotel.getCharacteristics().clear();
        }

        // 1) Borrar TODO en DB
        hotelCharacteristicRepository.deleteByHotel_Id(hotelId);
        hotelCharacteristicRepository.flush();

        // 2) Si viene vacío => queda sin características (APAGAR TODO)
        if (requests == null || requests.isEmpty()) {
            return hotel;
        }

        // 3) Insertar nuevas
        List<HotelCharacteristicEntity> savedList = new ArrayList<>();

        for (HotelCharacteristicValueRequest item : requests) {

            CharacteristicEntity characteristic = characteristicRepository.findById(item.getCharacteristicId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Característica no encontrada: " + item.getCharacteristicId()
                    ));

            HotelCharacteristicEntity hc = new HotelCharacteristicEntity();
            hc.setHotel(hotel);
            hc.setCharacteristic(characteristic);

            if (characteristic.getType() == CharacteristicEntity.Type.BOOLEAN) {

                // Si el front manda solo true, esto siempre llega en true.
                // Igual lo validamos para evitar null.
                if (item.getBoolValue() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "boolValue requerido para " + characteristic.getName());
                }

                hc.setBoolValue(item.getBoolValue());
                hc.setNumValue(null);

            } else {

                if (item.getNumValue() == null || item.getNumValue() < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "numValue inválido para " + characteristic.getName());
                }

                hc.setNumValue(item.getNumValue());
                hc.setBoolValue(null);
            }

            savedList.add(hotelCharacteristicRepository.save(hc));
        }

        // IMPORTANTÍSIMO: reflejar en el entity para que el JSON devuelto esté consistente
        hotel.getCharacteristics().addAll(savedList);

        return hotel;
    }
    // Se mantiene: elimina una imagen por URL (quita de DB y borra el archivo si existe)
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

    // =========================================================
    // Aplica characteristics al hotel (create / update / patch)
    // =========================================================
    private void applyCharacteristics(HotelEntity hotel, List<HotelCharacteristicValueRequest> reqList) {

        // Si el frontend actual todavía no envía characteristics => no tocamos nada.
        if (reqList == null) return;

        // Asegurar lista inicializada
        if (hotel.getCharacteristics() == null) {
            hotel.setCharacteristics(new ArrayList<>());
        } else {
            hotel.getCharacteristics().clear();
        }

        // Si viene lista vacía => queda limpio
        if (reqList.isEmpty()) return;

        // Traemos todas las características por IDs
        List<Long> ids = reqList.stream()
                .map(HotelCharacteristicValueRequest::getCharacteristicId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        List<CharacteristicEntity> found = characteristicRepository.findAllById(ids);
        if (found.size() != ids.size()) {
            Set<Long> foundIds = found.stream().map(CharacteristicEntity::getId).collect(Collectors.toSet());
            List<Long> missing = ids.stream().filter(cid -> !foundIds.contains(cid)).collect(Collectors.toList());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Características no encontradas: " + missing);
        }

        Map<Long, CharacteristicEntity> byId = found.stream()
                .collect(Collectors.toMap(CharacteristicEntity::getId, c -> c));

        for (HotelCharacteristicValueRequest item : reqList) {

            if (item.getCharacteristicId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "characteristicId is required");
            }

            CharacteristicEntity c = byId.get(item.getCharacteristicId());
            if (c == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Característica no encontrada: " + item.getCharacteristicId());
            }

            HotelCharacteristicEntity hc = new HotelCharacteristicEntity();
            hc.setHotel(hotel);
            hc.setCharacteristic(c);

            if (c.getType() == CharacteristicEntity.Type.BOOLEAN) {

                if (item.getBoolValue() == null) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "boolValue is required for BOOLEAN characteristic: " + c.getName()
                    );
                }
                hc.setBoolValue(item.getBoolValue());
                hc.setNumValue(null);

            } else if (c.getType() == CharacteristicEntity.Type.NUMBER) {

                if (item.getNumValue() == null) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "numValue is required for NUMBER characteristic: " + c.getName()
                    );
                }
                if (item.getNumValue() < 0) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "numValue must be >= 0 for characteristic: " + c.getName()
                    );
                }
                hc.setNumValue(item.getNumValue());
                hc.setBoolValue(null);

            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported characteristic type: " + c.getType());
            }

            hotel.getCharacteristics().add(hc);
        }
    }
}