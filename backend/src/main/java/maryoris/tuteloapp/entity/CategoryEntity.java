package maryoris.tuteloapp.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "CATEGORIES",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_categories_name", columnNames = "name"),
                @UniqueConstraint(name = "uk_categories_slug", columnNames = "slug")
        }
)
public class CategoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 120)
    private String slug;

    //  NUEVO: descripción
    @Column(length = 500)
    private String description;

    //  NUEVO: imagen representativa (URL)
    @Column(length = 600)
    private String imageUrl;

    public CategoryEntity() {}

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}