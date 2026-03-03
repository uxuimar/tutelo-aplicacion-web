package maryoris.tuteloapp.dto;

import java.util.ArrayList;
import java.util.List;

public class HotelPublicResponse {
    private Long id;
    private String name;
    private String city;
    private String address;
    private String description;

    private List<String> imageUrls = new ArrayList<>();
    private List<CategoryResponse> categories = new ArrayList<>();

    public HotelPublicResponse() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }

    public List<CategoryResponse> getCategories() { return categories; }
    public void setCategories(List<CategoryResponse> categories) { this.categories = categories; }
}
