package maryoris.tuteloapp.dto;

import jakarta.validation.constraints.NotNull;

public class UpdateUserAdminRequest {
    @NotNull
    private Boolean admin;

    public Boolean getAdmin() { return admin; }
    public void setAdmin(Boolean admin) { this.admin = admin; }
}
