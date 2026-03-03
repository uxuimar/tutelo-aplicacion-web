package maryoris.tuteloapp.controller;

import jakarta.validation.Valid;
import maryoris.tuteloapp.dto.LoginRequest;
import maryoris.tuteloapp.dto.UserRequest;
import maryoris.tuteloapp.dto.UserResponse;
import maryoris.tuteloapp.entity.UserEntity;
import maryoris.tuteloapp.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService service;

    public AuthController(UserService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public UserEntity register(@Valid @RequestBody UserRequest req) {
        return service.register(req);
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest req) {
        return service.login(req);
    }
}

