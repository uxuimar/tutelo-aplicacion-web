package maryoris.tuteloapp.controller;

import jakarta.validation.Valid;
import maryoris.tuteloapp.dto.CharacteristicRequest;
import maryoris.tuteloapp.dto.CharacteristicResponse;
import maryoris.tuteloapp.service.CharacteristicService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/characteristics")
public class AdminCharacteristicController {

    private final CharacteristicService service;

    public AdminCharacteristicController(CharacteristicService service) {
        this.service = service;
    }

    @GetMapping
    public List<CharacteristicResponse> list() {
        return service.list();
    }

    @PostMapping
    public CharacteristicResponse create(@Valid @RequestBody CharacteristicRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CharacteristicResponse> update(@PathVariable Long id, @Valid @RequestBody CharacteristicRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}