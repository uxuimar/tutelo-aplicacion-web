package maryoris.tuteloapp.dto;

import jakarta.validation.constraints.*;
import java.util.List;

public class UpdateHotelCategoriesRequest {

    @NotNull(message = "categoryIds is required")
    @Size(min = 1, message = "at least one category is required")
    private List<@NotNull Long> categoryIds;

    public List<Long> getCategoryIds() { return categoryIds; }
    public void setCategoryIds(List<Long> categoryIds) { this.categoryIds = categoryIds; }
}

