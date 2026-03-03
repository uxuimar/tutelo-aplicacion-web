package maryoris.tuteloapp.repository;

import maryoris.tuteloapp.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {

    @Query("select count(h) from HotelEntity h join h.categories c where c.id = :categoryId")
    long countHotelsUsingCategory(@Param("categoryId") Long categoryId);
}

