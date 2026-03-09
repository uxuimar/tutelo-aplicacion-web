package maryoris.tuteloapp.controller;

import jakarta.validation.Valid;
import maryoris.tuteloapp.dto.UserRequest;
import maryoris.tuteloapp.dto.UserResponse;
import maryoris.tuteloapp.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService service;

    public AuthController(UserService service) {
        this.service = service;
    }

    /*
     * CORRECCIÓN - Punto 3: Recomendaciones sobre la autenticación
     * El registro devuelve un DTO seguro (UserResponse) en lugar de UserEntity,
     * para evitar exponer el campo password, incluso hasheado.
     */
    @PostMapping("/register")
    public UserResponse register(@Valid @RequestBody UserRequest req) {
        return service.register(req);
    }

    /*
     * CORRECCIÓN - Punto 3: Recomendaciones sobre la autenticación
     * Se elimina POST /api/auth/login porque la autenticación ya está resuelta
     * por Spring Security. El frontend valida la sesión enviando credenciales
     * en Authorization y consultando GET /api/me.
     */
}
