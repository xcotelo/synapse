package synapse.rest.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MediaStorageService {

    private static final Logger logger = LoggerFactory.getLogger(MediaStorageService.class);

    @Value("${project.media.upload-dir:uploads/media}")
    private String uploadDir;

    public String storeFile(MultipartFile file) {
        try {
            Path storageDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(storageDir);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "media";
            String extension = "";
            int dotIndex = originalName.lastIndexOf('.');
            if (dotIndex >= 0 && dotIndex < originalName.length() - 1) {
                extension = originalName.substring(dotIndex);
            }

            String storedName = UUID.randomUUID().toString().replace("-", "") + extension;
            Path targetPath = storageDir.resolve(storedName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            logger.info("Archivo multimedia '{}' almacenado como '{}' en {}", originalName, storedName, storageDir);
            return storedName;
        } catch (IOException e) {
            logger.error("Error al almacenar archivo multimedia: {}", e.getMessage());
            throw new RuntimeException("No se pudo almacenar el archivo multimedia", e);
        }
    }

    public Resource loadAsResource(String filename) {
        try {
            Path storageDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = storageDir.resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
        } catch (Exception e) {
            logger.error("Error al cargar recurso multimedia '{}': {}", filename, e.getMessage());
        }
        throw new RuntimeException("No se pudo cargar el archivo multimedia solicitado");
    }

    public boolean deleteFile(String filename) {
        try {
            Path storageDir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = storageDir.resolve(filename).normalize();

            // Evitar path traversal: el fichero debe quedar dentro del directorio de uploads
            if (!filePath.startsWith(storageDir)) {
                throw new IllegalArgumentException("Nombre de archivo inválido");
            }

            boolean deleted = Files.deleteIfExists(filePath);
            if (deleted) {
                logger.info("Archivo multimedia '{}' eliminado de {}", filename, storageDir);
            } else {
                logger.info("Archivo multimedia '{}' no existe en {}", filename, storageDir);
            }
            return deleted;
        } catch (IllegalArgumentException e) {
            logger.warn("Solicitud de borrado de archivo inválida '{}': {}", filename, e.getMessage());
            throw e;
        } catch (IOException e) {
            logger.error("Error al eliminar archivo multimedia '{}': {}", filename, e.getMessage());
            throw new RuntimeException("No se pudo eliminar el archivo multimedia", e);
        }
    }
}
