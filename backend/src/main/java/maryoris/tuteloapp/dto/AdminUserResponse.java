package maryoris.tuteloapp.dto;

public class AdminUserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private boolean admin;

    public AdminUserResponse(Long id, String firstName, String lastName, String email, boolean admin) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.admin = admin;
    }

    public Long getId() { return id; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getEmail() { return email; }
    public boolean isAdmin() { return admin; }
}