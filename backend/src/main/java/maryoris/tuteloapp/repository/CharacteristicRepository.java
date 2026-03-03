package maryoris.tuteloapp.repository;

import maryoris.tuteloapp.entity.CharacteristicEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CharacteristicRepository extends JpaRepository<CharacteristicEntity, Long> {

    boolean existsByNameIgnoreCase(String name);

}
