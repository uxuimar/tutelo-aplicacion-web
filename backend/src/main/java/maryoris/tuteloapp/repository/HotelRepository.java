package maryoris.tuteloapp.repository;

import maryoris.tuteloapp.entity.HotelEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;

import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;

public interface HotelRepository extends JpaRepository<HotelEntity, Long> {

    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT DISTINCT h FROM HotelEntity h LEFT JOIN FETCH h.categories")
    List<HotelEntity> findAllWithCategories();

    @Override
    @EntityGraph(attributePaths = {
            "categories",
            "characteristics",
            "characteristics.characteristic"
    })
    List<HotelEntity> findAll();

    @Override
    @EntityGraph(attributePaths = {
            "categories",
            "characteristics",
            "characteristics.characteristic"
    })
    Optional<HotelEntity> findById(Long id);

    @Query("""
        SELECT DISTINCT h.city
        FROM HotelEntity h
        WHERE LOWER(TRIM(h.city)) LIKE CONCAT(LOWER(TRIM(:q)), '%')
        ORDER BY h.city
    """)
    List<String> suggestCities(@Param("q") String q, Pageable pageable);

    @Query("""
        SELECT DISTINCT h.city
        FROM HotelEntity h
        WHERE h.city IS NOT NULL AND TRIM(h.city) <> ''
        ORDER BY h.city
    """)
    List<String> listCities(Pageable pageable);
}