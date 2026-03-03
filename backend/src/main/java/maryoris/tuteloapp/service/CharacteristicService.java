package maryoris.tuteloapp.service;

import maryoris.tuteloapp.dto.CharacteristicRequest;
import maryoris.tuteloapp.dto.CharacteristicResponse;
import maryoris.tuteloapp.entity.CharacteristicEntity;
import maryoris.tuteloapp.repository.CharacteristicRepository;
import maryoris.tuteloapp.repository.HotelCharacteristicRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CharacteristicService {

    private final CharacteristicRepository characteristicRepository;
    private final HotelCharacteristicRepository hotelCharacteristicRepository;

    public CharacteristicService(
            CharacteristicRepository characteristicRepository,
            HotelCharacteristicRepository hotelCharacteristicRepository
    ) {
        this.characteristicRepository = characteristicRepository;
        this.hotelCharacteristicRepository = hotelCharacteristicRepository;
    }

    public List<CharacteristicEntity> listEntities() {
        return characteristicRepository.findAll();
    }

    public List<CharacteristicResponse> list() {
        return characteristicRepository.findAll().stream()
                .map(c -> new CharacteristicResponse(c.getId(), c.getName(), c.getIcon(), c.getType().name()))
                .toList();
    }

    public CharacteristicResponse create(CharacteristicRequest req) {
        String name = req.getName() == null ? null : req.getName().trim();
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }

        if (characteristicRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una característica con ese nombre");
        }

        CharacteristicEntity.Type type;
        try {
            type = CharacteristicEntity.Type.valueOf(req.getType().trim().toUpperCase());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "type debe ser BOOLEAN o NUMBER");
        }

        CharacteristicEntity c = new CharacteristicEntity();
        c.setName(name);
        c.setIcon(req.getIcon());
        c.setType(type);

        CharacteristicEntity saved = characteristicRepository.save(c);
        return new CharacteristicResponse(saved.getId(), saved.getName(), saved.getIcon(), saved.getType().name());
    }

    public CharacteristicResponse update(Long id, CharacteristicRequest req) {
        CharacteristicEntity c = characteristicRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Característica no existe"));

        String name = req.getName() == null ? null : req.getName().trim();
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }

        // Si cambió el nombre, validar uniqueness
        if (!name.equalsIgnoreCase(c.getName()) && characteristicRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe una característica con ese nombre");
        }

        CharacteristicEntity.Type type;
        try {
            type = CharacteristicEntity.Type.valueOf(req.getType().trim().toUpperCase());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "type debe ser BOOLEAN o NUMBER");
        }

        c.setName(name);
        c.setIcon(req.getIcon());
        c.setType(type);

        CharacteristicEntity saved = characteristicRepository.save(c);
        return new CharacteristicResponse(saved.getId(), saved.getName(), saved.getIcon(), saved.getType().name());
    }

    public void delete(Long id) {
        if (!characteristicRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Característica no existe");
        }

        // Evitar borrar si está asignada a hoteles
        if (hotelCharacteristicRepository.existsByCharacteristic_Id(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "No se puede eliminar: está asignada a uno o más hoteles");
        }

        characteristicRepository.deleteById(id);
    }
}
