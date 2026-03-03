package maryoris.tuteloapp.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import maryoris.tuteloapp.service.DbUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.util.matcher.RequestMatcher;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            DaoAuthenticationProvider daoAuthenticationProvider
    ) throws Exception {

        //  EntryPoint para /api/**: devuelve 401 JSON SIN WWW-Authenticate => evita popup del navegador
        AuthenticationEntryPoint apiEntryPoint = (HttpServletRequest request,
                                                  HttpServletResponse response,
                                                  org.springframework.security.core.AuthenticationException authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"unauthorized\"}");
        };

        //  Matcher: aplica solo a rutas /api/**
        RequestMatcher apiMatcher = request -> {
            String uri = request.getRequestURI();
            return uri != null && uri.startsWith("/api/");
        };

        http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .authenticationProvider(daoAuthenticationProvider)

                //  CLAVE: para /api/** usa entrypoint sin Basic-challenge (sin popup)
                .exceptionHandling(ex -> ex.defaultAuthenticationEntryPointFor(apiEntryPoint, apiMatcher))

                .authorizeHttpRequests(auth -> auth

                        // =========================
                        // PUBLICOS
                        // =========================

                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/api/cities/**").permitAll()

                        //  AUTH público (login/register)
                        .requestMatchers("/api/auth/**").permitAll()

                        //  GET públicos (lectura)
                        .requestMatchers(HttpMethod.GET, "/api/hotels/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/characteristics/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                        // =========================
                        // WRITE CATEGORIES (NO TOCAMOS ROLES)
                        // =========================

                        .requestMatchers(HttpMethod.POST, "/api/categories/**")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")

                        .requestMatchers(HttpMethod.PUT, "/api/categories/**")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")

                        .requestMatchers(HttpMethod.PATCH, "/api/categories/**")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")

                        .requestMatchers(HttpMethod.DELETE, "/api/categories/**")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")

                        // =========================
                        // PERFIL
                        // =========================

                        .requestMatchers("/api/me").authenticated()

                        .requestMatchers(HttpMethod.GET, "/api/admin/users")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")

                        // =========================
                        // ADMIN
                        // =========================

                        .requestMatchers("/api/admin/**")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")

                        .anyRequest().authenticated()
                )

                //  lo deje: sigue funcionando Basic (Postman/axios),
                // pero /api/** ya no dispara el popup del navegador
                .httpBasic();

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider(
            DbUserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder
    ) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {

        org.springframework.web.cors.CorsConfiguration config =
                new org.springframework.web.cors.CorsConfiguration();

        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:5173");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        org.springframework.web.cors.UrlBasedCorsConfigurationSource source =
                new org.springframework.web.cors.UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", config);

        return source;
    }
}