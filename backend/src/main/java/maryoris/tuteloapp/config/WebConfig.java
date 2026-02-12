package maryoris.tuteloapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:5183",
                        "http://localhost:5182",
                        "http://localhost:5181",
                        "http://localhost:5180",
                        "http://localhost:5177",
                        "http://localhost:5173"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");

        // opcional (si querés evitar problemas al servir imágenes desde el backend)
        registry.addMapping("/uploads/**")
                .allowedOrigins(
                        "http://localhost:5183",
                        "http://localhost:5182",
                        "http://localhost:5181",
                        "http://localhost:5180",
                        "http://localhost:5177",
                        "http://localhost:5173"
                )
                .allowedMethods("GET")
                .allowedHeaders("*");
    }
}


