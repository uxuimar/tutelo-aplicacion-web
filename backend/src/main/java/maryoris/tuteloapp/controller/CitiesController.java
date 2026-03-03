package maryoris.tuteloapp.controller;

import maryoris.tuteloapp.repository.HotelRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173") // en prod lo ajustás
public class CitiesController {

    private final HotelRepository hotelRepository;

    public CitiesController(HotelRepository hotelRepository) {
        this.hotelRepository = hotelRepository;
    }

    // GET /api/cities?s=bu
    @GetMapping("/cities")
    public List<String> cities(@RequestParam(name = "s", required = false) String s) {
        String q = (s == null) ? "" : s.trim();

        // Si está vacío, devuelve un listado base (ej: primeras 10)
        if (q.isBlank()) {
            return hotelRepository.listCities(PageRequest.of(0, 10));
        }

        return hotelRepository.suggestCities(q, PageRequest.of(0, 10));
    }
}