package maryoris.tuteloapp.dto;

import jakarta.validation.constraints.NotNull;

public class HotelCharacteristicValueRequest {

    @NotNull(message = "characteristicId is required")
    private Long characteristicId;

    // Para características BOOLEAN (ej: Wifi, Pileta, Cocina)
    private Boolean boolValue;

    // Para características NUMBER (ej: Habitaciones, Baños, Ambientes)
    private Integer numValue;

    public HotelCharacteristicValueRequest() {}

    public Long getCharacteristicId() { return characteristicId; }
    public void setCharacteristicId(Long characteristicId) { this.characteristicId = characteristicId; }

    public Boolean getBoolValue() { return boolValue; }
    public void setBoolValue(Boolean boolValue) { this.boolValue = boolValue; }

    public Integer getNumValue() { return numValue; }
    public void setNumValue(Integer numValue) { this.numValue = numValue; }
}
