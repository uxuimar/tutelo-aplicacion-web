package maryoris.tuteloapp.controller;

import jakarta.validation.Valid;
import maryoris.tuteloapp.dto.HotelRequest;
import maryoris.tuteloapp.entity.HotelEntity;
import maryoris.tuteloapp.service.HotelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/hotels")
public class AdminHotelController {

    private final HotelService service;

    public AdminHotelController(HotelService service) {
        this.service = service;
    }

    @PostMapping
    public HotelEntity create(@Valid @RequestBody HotelRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HotelEntity> update(@PathVariable Long id, @Valid @RequestBody HotelRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
