package maryoris.tuteloapp.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path root = Paths.get("uploads");
    private final Path categoriesDir = root.resolve("categories");
    private final Path hotelsDir = root.resolve("hotels");

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

        return "/uploads/categories/" + filename;
    }

    /*
     * CORRECCIÓN - Punto 5: Arquitectura del HotelController
     * La lógica de almacenamiento de imágenes de hoteles se mueve a la capa
     * de infraestructura/servicio para evitar operaciones de filesystem en el controller.
     */
    public List<String> saveHotelImages(List<MultipartFile> files) throws IOException {
        if (files == null || files.isEmpty()) {
            throw new IOException("No se enviaron archivos");
        }

        Files.createDirectories(hotelsDir);

        List<String> urls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            String original = StringUtils.cleanPath(
                    file.getOriginalFilename() == null ? "image" : file.getOriginalFilename()
            );

            String ext = "";
            int dot = original.lastIndexOf('.');
            if (dot >= 0 && dot < original.length() - 1) {
                ext = original.substring(dot).toLowerCase();
            }

            String filename = UUID.randomUUID() + ext;

            Path target = hotelsDir.resolve(filename).normalize();
            if (!target.startsWith(hotelsDir)) {
                throw new IOException("Ruta inválida");
            }

            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            urls.add("/uploads/hotels/" + filename);
        }

        return urls;
    }

    /*
     * CORRECCIÓN - Punto 5: Arquitectura del HotelController
     * El borrado físico de archivos también se centraliza en FileStorageService
     * para separar lógica de infraestructura de la lógica HTTP/controlador.
     */
    public void deleteHotelImageByUrl(String url) throws IOException {
        if (url == null || url.isBlank()) {
            return;
        }

        String normalizedUrl = url.replace("\\", "/");

        if (!normalizedUrl.startsWith("/uploads/hotels/") && !normalizedUrl.startsWith("uploads/hotels/")) {
            return;
        }

        String filename = normalizedUrl
                .replaceFirst("^/uploads/hotels/", "")
                .replaceFirst("^uploads/hotels/", "");

        Path filePath = hotelsDir.resolve(filename).normalize();

        if (!filePath.startsWith(hotelsDir.normalize())) {
            throw new IOException("Ruta inválida");
        }

        Files.deleteIfExists(filePath);
    }
}