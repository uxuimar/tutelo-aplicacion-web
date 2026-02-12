package maryoris.tuteloapp.repository;

import maryoris.tuteloapp.entity.HotelEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HotelRepository extends JpaRepository<HotelEntity, Long> {
    boolean existsByNameIgnoreCase(String name);
}

