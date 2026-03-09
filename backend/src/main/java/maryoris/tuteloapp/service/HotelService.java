package maryoris.tuteloapp.service;

import maryoris.tuteloapp.dto.CategoryResponse;
import maryoris.tuteloapp.dto.HotelCharacteristicValueRequest;
import maryoris.tuteloapp.dto.HotelPublicResponse;
import maryoris.tuteloapp.dto.HotelRequest;
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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HotelService {

    private final HotelRepository hotelRepository;
    private final CategoryRepository categoryRepository;
    private final CharacteristicRepository characteristicRepository;
    private final HotelCharacteristicRepository hotelCharacteristicRepository;
    private final FileStorageService fileStorageService;

    public HotelService(
            HotelRepository hotelRepository,
            CategoryRepository categoryRepository,
            CharacteristicRepository characteristicRepository,
            HotelCharacteristicRepository hotelCharacteristicRepository,
            FileStorageService fileStorageService
    ) {
        this.hotelRepository = hotelRepository;
        this.categoryRepository = categoryRepository;
        this.characteristicRepository = characteristicRepository;
        this.hotelCharacteristicRepository = hotelCharacteristicRepository;
        this.fileStorageService = fileStorageService;
    }

    public HotelEntity create(HotelRequest req) {
        HotelEntity hotel = new HotelEntity();
        hotel.setName(req.getName());
        hotel.setCity(req.getCity());
        hotel.setAddress(req.getAddress());
        hotel.setDescription(req.getDescription());

        applyCharacteristics(hotel, req.getCharacteristics());

        return create(hotel);
    }

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
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe un hotel con ese nombre"
            );
        }
    }

    public List<HotelEntity> list() {
        return hotelRepository.findAll();
    }

    public HotelEntity getById(Long id) {
        return hotelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel no existe"));
    }

    public void delete(Long id) {
        if (!hotelRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel no existe");
        }
        hotelRepository.deleteById(id);
    }

    public HotelEntity update(Long id, HotelRequest req) {
        HotelEntity h = hotelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel no existe"));

        h.setName(req.getName());
        h.setCity(req.getCity());
        h.setAddress(req.getAddress());
        h.setDescription(req.getDescription());

        applyCharacteristics(h, req.getCharacteristics());

        return hotelRepository.save(h);
    }

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
                    .toList();

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

    @Transactional
    public HotelEntity updateCharacteristics(Long hotelId, List<HotelCharacteristicValueRequest> requests) {

        HotelEntity hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel no existe"));

        if (hotel.getCharacteristics() == null) {
            hotel.setCharacteristics(new ArrayList<>());
        } else {
            hotel.getCharacteristics().clear();
        }

        hotelCharacteristicRepository.deleteByHotel_Id(hotelId);
        hotelCharacteristicRepository.flush();

        if (requests == null || requests.isEmpty()) {
            return hotel;
        }

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

        hotel.getCharacteristics().addAll(savedList);

        return hotel;
    }

    /*
     * CORRECCIÓN - Punto 5: Arquitectura del HotelController
     * La lógica de carga de imágenes se delega al service, que coordina
     * la persistencia del hotel y reutiliza FileStorageService para el filesystem.
     */
    @Transactional
    public List<String> uploadImages(Long hotelId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No se enviaron archivos");
        }

        HotelEntity hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel no existe"));

        try {
            List<String> urls = fileStorageService.saveHotelImages(files);

            if (hotel.getImageUrls() == null) {
                hotel.setImageUrls(new ArrayList<>());
            }

            hotel.getImageUrls().addAll(urls);
            hotelRepository.save(hotel);

            return urls;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error guardando imágenes", ex);
        }
    }

    /*
     * CORRECCIÓN - Punto 5: Arquitectura del HotelController
     * El service mantiene la lógica de negocio de desvincular la imagen del hotel
     * y delega el borrado físico del archivo a FileStorageService.
     */
    public void deleteImageByUrl(Long hotelId, String url) {
        HotelEntity hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel no existe"));

        if (hotel.getImageUrls() == null || hotel.getImageUrls().isEmpty()) {
            return;
        }

        String decoded = URLDecoder.decode(url, StandardCharsets.UTF_8);

        boolean removed = hotel.getImageUrls().removeIf(u -> u != null && u.equals(decoded));
        if (removed) {
            hotelRepository.save(hotel);
        }

        try {
            fileStorageService.deleteHotelImageByUrl(decoded);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error eliminando archivo físico", ex);
        }
    }

    private void applyCharacteristics(HotelEntity hotel, List<HotelCharacteristicValueRequest> reqList) {
        if (reqList == null) return;

        if (hotel.getCharacteristics() == null) {
            hotel.setCharacteristics(new ArrayList<>());
        } else {
            hotel.getCharacteristics().clear();
        }

        if (reqList.isEmpty()) return;

        List<Long> ids = reqList.stream()
                .map(HotelCharacteristicValueRequest::getCharacteristicId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        List<CharacteristicEntity> found = characteristicRepository.findAllById(ids);
        if (found.size() != ids.size()) {
            Set<Long> foundIds = found.stream().map(CharacteristicEntity::getId).collect(Collectors.toSet());
            List<Long> missing = ids.stream().filter(cid -> !foundIds.contains(cid)).toList();
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