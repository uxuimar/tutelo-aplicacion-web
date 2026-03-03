package maryoris.tuteloapp.controller;

import jakarta.validation.Valid;
import maryoris.tuteloapp.dto.AdminUserResponse;
import maryoris.tuteloapp.dto.UpdateUserAdminRequest;
import maryoris.tuteloapp.entity.UserEntity;
import maryoris.tuteloapp.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserRepository repo;

    public AdminUserController(UserRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<AdminUserResponse> list() {
        return repo.findAll()
                .stream()
                .map(u -> new AdminUserResponse(u.getId(), u.getFirstName(), u.getLastName(), u.getEmail(), u.isAdmin()))
                .toList();
    }

    @PatchMapping("/{id}/admin")
    public AdminUserResponse setAdmin(@PathVariable Long id, @Valid @RequestBody UpdateUserAdminRequest req) {
        UserEntity u = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no existe"));

        u.setAdmin(Boolean.TRUE.equals(req.getAdmin()));
        UserEntity saved = repo.save(u);

        return new AdminUserResponse(saved.getId(), saved.getFirstName(), saved.getLastName(), saved.getEmail(), saved.isAdmin());
    }
}