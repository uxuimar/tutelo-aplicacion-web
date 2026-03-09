package maryoris.tuteloapp.controller;

import maryoris.tuteloapp.entity.UserEntity;
import maryoris.tuteloapp.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class MeController {

    private final UserRepository userRepository;

    public MeController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /*
     * CORRECCIÓN USER STORY - Identificación del usuario
     * El endpoint /api/me no solo valida sesión, también debe devolver
     * la información personal necesaria para que el frontend muestre
     * nombre, apellido e iniciales del usuario autenticado.
     *
     * Se mantiene alineado con las correcciones de autenticación ya hechas,
     * pero además cumple el criterio de aceptación de mostrar la
     * información personal del usuario luego del login.
     */
    @GetMapping("/api/me")
    public Map<String, Object> me(Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }

        String email = authentication.getName();

        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuario autenticado no encontrado en base de datos"
                ));

        Map<String, Object> response = new HashMap<>();

        response.put("authenticated", true);
        response.put("email", user.getEmail());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());

        List<String> roles = authentication.getAuthorities()
                .stream()
                .map(a -> a.getAuthority())
                .toList();

        response.put("roles", roles);

        return response;
    }
}