package maryoris.tuteloapp.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class MeController {

    @GetMapping("/api/me")
    public Map<String, Object> me(Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        response.put("authenticated", authentication.isAuthenticated());
        response.put("email", authentication.getName());

        List<String> roles = authentication.getAuthorities()
                .stream()
                .map(a -> a.getAuthority())
                .toList();

        response.put("roles", roles);

        return response;
    }
}