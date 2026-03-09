package maryoris.tuteloapp.service;

import maryoris.tuteloapp.dto.UserRequest;
import maryoris.tuteloapp.dto.UserResponse;
import maryoris.tuteloapp.entity.UserEntity;
import maryoris.tuteloapp.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository repo, PasswordEncoder passwordEncoder) {
        this.repo = repo;
        this.passwordEncoder = passwordEncoder;
    }

    /*
     * CORRECCIÓN - Punto 3: Recomendaciones sobre la autenticación
     * El servicio de registro devuelve un DTO seguro en lugar de exponer UserEntity.
     * De esta forma no se devuelve el campo password en la respuesta.
     */
    public UserResponse register(UserRequest req) {

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

        /*
         * CORRECCIÓN - Punto 3: Recomendaciones sobre la autenticación
         * La contraseña se almacena hasheada con BCrypt, pero nunca debe exponerse
         * en las respuestas del backend.
         */
        user.setPassword(passwordEncoder.encode(req.getPassword()));

        /*
         * CORRECCIÓN - Punto 2: Problemas en autenticación
         * Un usuario registrado por flujo público no debe crearse como admin.
         */
        user.setAdmin(false);

        UserEntity saved = repo.save(user);

        return new UserResponse(
                saved.getId(),
                saved.getFirstName(),
                saved.getLastName(),
                saved.getEmail()
        );
    }

    /*
     * CORRECCIÓN - Punto 3: Recomendaciones sobre la autenticación
     * Se eliminan los métodos login() manuales porque la autenticación ya la
     * resuelve Spring Security en cada request. El proyecto utiliza /api/me
     * como verificación de sesión en lugar de un login paralelo.
     */
}