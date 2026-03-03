package maryoris.tuteloapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    public CommandLineRunner generatePassword(PasswordEncoder passwordEncoder) {
        return args -> {
            String raw = "12345678";
            String encoded = passwordEncoder.encode(raw);
            System.out.println("HASH PARA 12345678: " + encoded);
        };
    }
}
