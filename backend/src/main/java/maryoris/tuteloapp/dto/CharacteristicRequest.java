package maryoris.tuteloapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CharacteristicRequest {

    @NotBlank(message = "name is required")
    private String name;

    // opcional (string) ej: "wifi"
    private String icon;

    @NotNull(message = "type is required")
    private String type; // "BOOLEAN" | "NUMBER"

    public CharacteristicRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
