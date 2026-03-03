package maryoris.tuteloapp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(
        name = "characteristics",
        uniqueConstraints = @UniqueConstraint(name = "uk_characteristics_name", columnNames = "name")
)
public class CharacteristicEntity {

    public enum Type {
        BOOLEAN,
        NUMBER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    // Ej: "wifi", "snowflake", "tv" (lo consumís en frontend como string)
    private String icon;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type = Type.BOOLEAN;

    public CharacteristicEntity() {}

    public CharacteristicEntity(String name, String icon, Type type) {
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

    public Type getType() { return type; }
    public void setType(Type type) { this.type = type; }
}