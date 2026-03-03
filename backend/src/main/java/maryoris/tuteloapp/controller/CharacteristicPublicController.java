package maryoris.tuteloapp.controller;

import maryoris.tuteloapp.dto.CharacteristicPublicResponse;
import maryoris.tuteloapp.repository.CharacteristicRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/characteristics")
public class CharacteristicPublicController {

    private final CharacteristicRepository characteristicRepository;

    public CharacteristicPublicController(CharacteristicRepository characteristicRepository) {
        this.characteristicRepository = characteristicRepository;
    }

    @GetMapping
    public List<CharacteristicPublicResponse> list() {
        return characteristicRepository.findAll()
                .stream()
                .map(c -> new CharacteristicPublicResponse(
                        c.getId(),
                        c.getName(),
                        c.getType() != null ? c.getType().name() : null
                ))
                .toList();
    }
}
