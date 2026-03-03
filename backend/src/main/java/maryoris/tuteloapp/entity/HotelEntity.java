package maryoris.tuteloapp.entity;

import jakarta.persistence.*;
import java.util.*;

@Entity
@Table(name = "hotels")
public class HotelEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String address;

    @Column(length = 2000)
    private String description;

    // =============================
    // CATEGORÍAS
    // =============================
    @ManyToMany
    @JoinTable(
            name = "hotel_categories",
            joinColumns = @JoinColumn(name = "hotel_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    private Set<CategoryEntity> categories = new HashSet<>();

    // =============================
    // IMÁGENES
    // =============================
    @ElementCollection
    @CollectionTable(
            name = "hotel_images",
            joinColumns = @JoinColumn(name = "hotel_id")
    )
    @Column(name = "image_url")
    private List<String> imageUrls = new ArrayList<>();

    // =============================
    // CARACTERÍSTICAS
    // =============================
    @OneToMany(
            mappedBy = "hotel",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<HotelCharacteristicEntity> characteristics = new ArrayList<>();

    // =============================
    // CONSTRUCTOR
    // =============================
    public HotelEntity() {}

    // =============================
    // GETTERS Y SETTERS
    // =============================

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Set<CategoryEntity> getCategories() { return categories; }
    public void setCategories(Set<CategoryEntity> categories) { this.categories = categories; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public List<HotelCharacteristicEntity> getCharacteristics() { return characteristics; }
    public void setCharacteristics(List<HotelCharacteristicEntity> characteristics) { this.characteristics = characteristics; }
}