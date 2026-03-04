package synapse.model.services;

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
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
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

            String rawName = file.getOriginalFilename();
            String originalName = rawName != null ? rawName : "media";
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

    @SuppressWarnings("null")
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

    /**
     * Detects the MediaType for a resource, with fallback for common extensions.
     */
    public MediaType detectMediaType(Resource resource) {
        MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        String rawFilename = resource.getFilename();
        String name = rawFilename != null ? rawFilename.toLowerCase() : "";
        if (MediaType.APPLICATION_OCTET_STREAM.equals(mediaType)) {
            if (name.endsWith(".mp3")) {
                mediaType = MediaType.parseMediaType("audio/mpeg");
            } else if (name.endsWith(".mp4")) {
                mediaType = MediaType.parseMediaType("video/mp4");
            }
        }
        return mediaType;
    }

    /**
     * Reads a byte range from a media file. Supports HTTP Range header format.
     *
     * @param filename    the stored filename
     * @param rangeHeader the raw HTTP Range header value (e.g. "bytes=0-1023")
     * @return RangeResult with the byte data and Content-Range header
     * @throws RangeNotSatisfiableException if the range is invalid
     */
    public RangeResult readRange(String filename, String rangeHeader) {
        Path storageDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path filePath = storageDir.resolve(filename).normalize();

        long fileLength;
        try {
            fileLength = Files.size(filePath);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo obtener el tamaño del archivo", e);
        }

        String rangeValue = rangeHeader.substring("bytes=".length()).trim();
        String[] parts = rangeValue.split("-", 2);
        if (parts.length != 2) {
            throw new RangeNotSatisfiableException(fileLength);
        }

        long start;
        long end;
        try {
            if (parts[0].isEmpty()) {
                long suffixLength = Long.parseLong(parts[1]);
                if (suffixLength <= 0) {
                    throw new NumberFormatException();
                }
                start = Math.max(0, fileLength - suffixLength);
                end = fileLength - 1;
            } else {
                start = Long.parseLong(parts[0]);
                end = parts[1].isEmpty() ? fileLength - 1 : Long.parseLong(parts[1]);
            }
        } catch (NumberFormatException ex) {
            throw new RangeNotSatisfiableException(fileLength);
        }

        if (start < 0 || start >= fileLength) {
            throw new RangeNotSatisfiableException(fileLength);
        }

        end = Math.min(end, fileLength - 1);
        if (end < start) {
            throw new RangeNotSatisfiableException(fileLength);
        }

        long requestedLength = end - start + 1;
        int chunkLength = (int) Math.min(1024L * 1024L, requestedLength);

        byte[] data = new byte[chunkLength];
        int bytesRead;
        try (var is = Files.newInputStream(filePath)) {
            long skipped = is.skip(start);
            while (skipped < start) {
                long s = is.skip(start - skipped);
                if (s <= 0) break;
                skipped += s;
            }
            bytesRead = is.read(data);
        } catch (IOException e) {
            throw new RuntimeException("Error al leer el rango del archivo", e);
        }

        if (bytesRead < 0) {
            throw new RangeNotSatisfiableException(fileLength);
        }

        if (bytesRead != data.length) {
            byte[] trimmed = new byte[bytesRead];
            System.arraycopy(data, 0, trimmed, 0, bytesRead);
            data = trimmed;
        }

        long actualEnd = start + data.length - 1;
        String contentRange = "bytes " + start + "-" + actualEnd + "/" + fileLength;

        return new RangeResult(data, contentRange);
    }

    // ── Result / Exception classes ──────────────────────────────────────

    public static class RangeResult {
        private final byte[] data;
        private final String contentRangeHeader;

        public RangeResult(byte[] data, String contentRangeHeader) {
            this.data = data;
            this.contentRangeHeader = contentRangeHeader;
        }

        public byte[] getData() { return data; }
        public String getContentRangeHeader() { return contentRangeHeader; }
    }

    public static class RangeNotSatisfiableException extends RuntimeException {
        private final long fileLength;

        public RangeNotSatisfiableException(long fileLength) {
            super("Range not satisfiable");
            this.fileLength = fileLength;
        }

        public String getContentRangeHeader() {
            return "bytes */" + fileLength;
        }
    }
}
