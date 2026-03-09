package maryoris.tuteloapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class HotelRequest {

    /*
     * CORRECCIÓN - Punto 6: Validaciones y manejo de excepciones
     * Se ajustan las validaciones del DTO para reducir mensajes duplicados
     * innecesarios cuando un campo viene vacío y mejorar la claridad
     * de las respuestas centralizadas de error.
     */
    @NotBlank(message = "name is required")
    private String name;

    @NotBlank(message = "city is required")
    private String city;

    @NotBlank(message = "address is required")
    private String address;

    @NotBlank(message = "description is required")
    private String description;

    // (opcional): lista de características con valores
    // Si el frontend no lo envía, queda null y no rompe nada.
    private List<HotelCharacteristicValueRequest> characteristics;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = normalize(name);
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = normalize(city);
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = normalize(address);
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = normalize(description);
    }

    public List<HotelCharacteristicValueRequest> getCharacteristics() {
        return characteristics;
    }

    public void setCharacteristics(List<HotelCharacteristicValueRequest> characteristics) {
        this.characteristics = characteristics;
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }
}
