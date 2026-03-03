package maryoris.tuteloapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class HotelRequest {

    @NotBlank(message = "name is required")
    @Size(min = 2, max = 120, message = "name must be between 2 and 120 characters")
    private String name;

    @NotBlank(message = "city is required")
    @Size(min = 2, max = 80, message = "city must be between 2 and 80 characters")
    private String city;

    @NotBlank(message = "address is required")
    @Size(min = 5, max = 180, message = "address must be between 5 and 180 characters")
    private String address;

    @NotBlank(message = "description is required")
    @Size(min = 10, max = 1000, message = "description must be between 10 and 1000 characters")
    private String description;

    // (opcional): lista de características con valores
    // Si el frontend no lo envía, queda null y no rompe nada.
    private List<HotelCharacteristicValueRequest> characteristics;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    // getters/setters
    public List<HotelCharacteristicValueRequest> getCharacteristics() { return characteristics; }
    public void setCharacteristics(List<HotelCharacteristicValueRequest> characteristics) { this.characteristics = characteristics; }
}
