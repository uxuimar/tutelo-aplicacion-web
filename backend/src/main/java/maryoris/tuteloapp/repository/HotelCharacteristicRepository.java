package maryoris.tuteloapp.repository;

import maryoris.tuteloapp.entity.HotelCharacteristicEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface HotelCharacteristicRepository extends JpaRepository<HotelCharacteristicEntity, Long> {

    // para evitar borrar una característica que esté en uso
    boolean existsByCharacteristic_Id(Long characteristicId);

    // delete derivado (lo usamos en HotelService)
    void deleteByHotel_Id(Long hotelId);

    // alternativa equivalente (si JPQL)
    @Transactional
    @Modifying
    @Query("delete from HotelCharacteristicEntity hc where hc.hotel.id = :hotelId")
    void deleteAllByHotelId(@Param("hotelId") Long hotelId);
}