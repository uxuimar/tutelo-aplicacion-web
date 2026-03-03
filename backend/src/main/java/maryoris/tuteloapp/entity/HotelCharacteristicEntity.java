package maryoris.tuteloapp.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "hotel_characteristics",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_hotel_characteristics_hotel_characteristic",
                columnNames = {"hotel_id", "characteristic_id"}
        )
)
public class HotelCharacteristicEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Muchos registros por hotel
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotel_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonBackReference
    private HotelEntity hotel;

    // Muchos registros por característica
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "characteristic_id", nullable = false)
    private CharacteristicEntity characteristic;

    // Valor booleano (si characteristic.type == BOOLEAN)
    @Column(name = "bool_value")
    private Boolean boolValue;

    // Valor numérico (si characteristic.type == NUMBER)
    @Column(name = "num_value")
    private Integer numValue;

    public HotelCharacteristicEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public HotelEntity getHotel() { return hotel; }
    public void setHotel(HotelEntity hotel) { this.hotel = hotel; }

    public CharacteristicEntity getCharacteristic() { return characteristic; }
    public void setCharacteristic(CharacteristicEntity characteristic) { this.characteristic = characteristic; }

    public Boolean getBoolValue() { return boolValue; }
    public void setBoolValue(Boolean boolValue) { this.boolValue = boolValue; }

    public Integer getNumValue() { return numValue; }
    public void setNumValue(Integer numValue) { this.numValue = numValue; }
}
