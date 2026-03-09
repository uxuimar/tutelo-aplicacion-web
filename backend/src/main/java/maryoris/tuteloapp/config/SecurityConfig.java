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
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.util.matcher.RequestMatcher;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            DaoAuthenticationProvider daoAuthenticationProvider
    ) throws Exception {

        /*
         * CORRECCIÓN VERÓNICA - Punto 1: Seguridad y control de acceso
         * Para rutas /api/**, cuando el usuario NO está autenticado,
         * se devuelve 401 Unauthorized en JSON y se evita el popup del navegador.
         */
        AuthenticationEntryPoint apiEntryPoint = (HttpServletRequest request,
                                                  HttpServletResponse response,
                                                  org.springframework.security.core.AuthenticationException authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"unauthorized\"}");
        };

        /*
         * CORRECCIÓN VERÓNICA - Punto 1: Seguridad y control de acceso
         * Para rutas /api/**, cuando el usuario SÍ está autenticado
         * pero no tiene permisos suficientes, se devuelve 403 Forbidden.
         */
        AccessDeniedHandler apiAccessDeniedHandler = (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"forbidden\"}");
        };

        // Aplica manejo especial solo a rutas /api/**
        RequestMatcher apiMatcher = request -> {
            String uri = request.getRequestURI();
            return uri != null && uri.startsWith("/api/");
        };

        http
                .cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
                .authenticationProvider(daoAuthenticationProvider)

                /*
                 * CORRECCIÓN VERÓNICA - Punto 1: Seguridad y control de acceso
                 * Se definen respuestas HTTP correctas para autenticación/autorización:
                 * 401 cuando falta autenticación, 403 cuando falta permiso.
                 */
                .exceptionHandling(ex -> ex
                        .defaultAuthenticationEntryPointFor(apiEntryPoint, apiMatcher)
                        .defaultAccessDeniedHandlerFor(apiAccessDeniedHandler, apiMatcher)
                )

                .authorizeHttpRequests(auth -> auth

                        // =========================
                        // PUBLICOS
                        // =========================

                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/api/cities/**").permitAll()

                        // AUTH público (login/register)
                        .requestMatchers("/api/auth/**").permitAll()

                        // GET públicos (lectura)
                        .requestMatchers(HttpMethod.GET, "/api/hotels/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/characteristics/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

                        // =========================
                        // WRITE CATEGORIES
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

                        /*
                         * CORRECCIÓN VERÓNICA - Punto 1: Seguridad y control de acceso
                         * Todo recurso administrativo queda restringido a ADMIN/SUPER_ADMIN.
                         */
                        .requestMatchers("/api/admin/**")
                        .hasAnyRole("ADMIN", "SUPER_ADMIN")

                        .anyRequest().authenticated()
                )

                // Se mantiene Basic Auth para Postman/frontend
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