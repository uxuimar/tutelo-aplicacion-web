package maryoris.tuteloapp.dto;

public class CharacteristicResponse {

    private Long id;
    private String name;
    private String icon;
    private String type; // "BOOLEAN" | "NUMBER"

    public CharacteristicResponse() {}

    public CharacteristicResponse(Long id, String name, String icon, String type) {
        this.id = id;
        this.name = name;
        this.icon = icon;
        this.type = type;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
