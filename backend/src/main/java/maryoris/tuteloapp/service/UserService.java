package maryoris.tuteloapp.service;

import maryoris.tuteloapp.dto.UserRequest;
import maryoris.tuteloapp.entity.UserEntity;
import maryoris.tuteloapp.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import maryoris.tuteloapp.dto.LoginRequest;
import maryoris.tuteloapp.dto.UserResponse;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UserService {

    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository repo, PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
    }

    public UserEntity register(UserRequest req) {

        if (req.getFirstName() == null || req.getFirstName().isBlank()
                || req.getLastName() == null || req.getLastName().isBlank()
                || req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Todos los campos son obligatorios"
            );
        }

        String email = req.getEmail().trim().toLowerCase();

        if (repo.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ya existe una cuenta con ese email"
            );
        }

        UserEntity user = new UserEntity();
        user.setFirstName(req.getFirstName().trim());
        user.setLastName(req.getLastName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.getPassword()));

        // Por defecto, un usuario registrado NO es admin
        // (esto requiere que UserEntity tenga el campo admin + setter)
        user.setAdmin(false);

        return repo.save(user);
    }

    public UserEntity login(UserRequest req) {

        if (req.getEmail() == null || req.getPassword() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Credenciales inválidas");
        }

        var user = repo.findByEmailIgnoreCase(req.getEmail().trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Credenciales incorrectas"
                ));

        if (!user.getPassword().equals(req.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Credenciales incorrectas"
            );
        }

        return user;
    }

    public UserResponse login(LoginRequest req) {

        if (req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email y contraseña son obligatorios");
        }

        String email = req.getEmail().trim().toLowerCase();

        UserEntity user = repo.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Credenciales incorrectas"
                ));

        if (!user.getPassword().equals(req.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales incorrectas");
        }

        return new UserResponse(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail());
    }

}

