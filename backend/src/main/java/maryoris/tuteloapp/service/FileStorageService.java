package maryoris.tuteloapp.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path root = Paths.get("uploads");
    private final Path categoriesDir = root.resolve("categories");

    public String saveCategoryImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("Archivo vacío");
        }

        Files.createDirectories(categoriesDir);

        String original = StringUtils.cleanPath(
                file.getOriginalFilename() == null ? "image" : file.getOriginalFilename()
        );

        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0 && dot < original.length() - 1) {
            ext = original.substring(dot).toLowerCase();
        }

        String filename = UUID.randomUUID() + ext;

        Path target = categoriesDir.resolve(filename).normalize();
        if (!target.startsWith(categoriesDir)) {
            throw new IOException("Ruta inválida");
        }

        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        //  URL pública compatible con tu ResourceHandler "/uploads/**"
        return "/uploads/categories/" + filename;
    }
}