package synapse.rest.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.io.IOException;

import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.multipart.MultipartFile;

import synapse.rest.dtos.BrainSuggestParamsDto;
import synapse.rest.dtos.BrainSuggestionDto;
import synapse.rest.services.ClaudeAIService;
import synapse.rest.services.ContentExtractionService;
import synapse.rest.services.MediaStorageService;

/**
 * Endpoint que utiliza IA (LLaMA 3) para clasificar y analizar contenido.
 * Extrae contenido de URLs y utiliza LLaMA 3 para clasificación inteligente.
 */
@RestController
@RequestMapping("/api/brain")
public class BrainController {
    private static final Logger logger = LoggerFactory.getLogger(BrainController.class);

    @Autowired
    private ContentExtractionService contentExtractionService;

    @Autowired
    private ClaudeAIService claudeAIService;

    @Autowired
    private MediaStorageService mediaStorageService;

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    @PostMapping("/suggest")
    @ResponseStatus(HttpStatus.OK)
    public BrainSuggestionDto suggest(@RequestBody BrainSuggestParamsDto params) {
        logger.info("Recibida petición de sugerencia para contenido: {}", params.getContent());

        String inputContent = params.getContent() == null ? "" : params.getContent().trim();

        if (inputContent.isEmpty()) {
            return new BrainSuggestionDto("nota", "Nota", "", "apunte", new String[] { "general" });
        }

        // 1. Extraer contenido si es una URL
        String contentToAnalyze = inputContent;
        ContentExtractionService.ExtractedContent extracted = null;

        if (isUrl(inputContent)) {
            String urlToExtract = inputContent;
            if (urlToExtract.toLowerCase().startsWith("www.")) {
                urlToExtract = "http://" + urlToExtract;
            }
            try {
                extracted = contentExtractionService.extractContent(urlToExtract);
                // Combinar título, descripción y contenido para el análisis
                StringBuilder fullContent = new StringBuilder();
                if (!extracted.getTitle().isEmpty()) {
                    fullContent.append("Título: ").append(extracted.getTitle()).append("\n\n");
                }
                if (!extracted.getDescription().isEmpty()) {
                    fullContent.append("Descripción: ").append(extracted.getDescription()).append("\n\n");
                }
                if (!extracted.getContent().isEmpty()) {
                    fullContent.append("Contenido: ").append(extracted.getContent());
                }
                contentToAnalyze = fullContent.toString();

                // Si la extracción falló, usar el contenido original
                if (contentToAnalyze.trim().isEmpty()) {
                    contentToAnalyze = inputContent;
                }
            } catch (Exception e) {
                logger.error("Error al extraer contenido de la URL {}: {}", inputContent, e.getMessage());
                // Si falla la extracción, usar el contenido original
                contentToAnalyze = inputContent;
            }
            logger.info("Contenido extraído de URL: {}", contentToAnalyze);
        }

        logger.info("Enviando contenido a la IA para clasificación...");
        ClaudeAIService.ClassificationResult classification = claudeAIService.classifyContent(contentToAnalyze);

        // 3. Si extrajimos contenido de una URL, usar el título extraído si LLaMA 3 no
        // proporcionó uno mejor
        String finalTitle = classification.getTitle();
        if (extracted != null && !extracted.getTitle().isEmpty() &&
                (finalTitle == null || finalTitle.isEmpty() || finalTitle.equals("Nota"))) {
            finalTitle = extracted.getTitle();
        }

        // 4. Usar el tipo detectado por la extracción si es más específico
        String finalType = classification.getType();
        if (extracted != null && extracted.getType() != null && !extracted.getType().equals("text")) {
            finalType = extracted.getType();
        }

        return new BrainSuggestionDto(
                finalType,
                finalTitle != null ? finalTitle : "Nota",
                classification.getSummary(),
                classification.getDetailedContent(),
                classification.getDestination(),
                classification.getTags());
    }

    @PostMapping(value = "/suggest/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.OK)
    public BrainSuggestionDto suggestFromFile(@RequestPart("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No se ha enviado ningún archivo");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "archivo";
        String lowerName = originalName.toLowerCase();
        String contentType = file.getContentType() != null ? file.getContentType() : "";

        boolean isAudio = contentType.startsWith("audio/") || lowerName.endsWith(".mp3") || lowerName.endsWith(".wav");
        boolean isVideo = contentType.startsWith("video/") || lowerName.endsWith(".mp4") || lowerName.endsWith(".mov");

        StringBuilder description = new StringBuilder();

        if (isAudio) {
            description.append("Archivo de audio subido por el usuario (probablemente un MP3).\n\n");
            description.append("Nombre de archivo: ").append(originalName).append("\n");
            description.append("Tamaño aproximado: ")
                    .append(String.format("%.2f MB", file.getSize() / (1024.0 * 1024.0)))
                    .append("\n\n");
            description.append("INFORMACIÓN PARA LA IA: A partir del nombre del archivo y estos metadatos, intenta deducir artista, autor o grupo probable, ");
            description.append("así como el estilo o temática del audio. Si el nombre no da pistas claras, indícalo explícitamente.\n");
        } else if (isVideo) {
            description.append("Archivo de vídeo subido por el usuario (por ejemplo, MP4).\n\n");
            description.append("Nombre de archivo: ").append(originalName).append("\n");
            description.append("Tamaño aproximado: ")
                    .append(String.format("%.2f MB", file.getSize() / (1024.0 * 1024.0)))
                    .append("\n\n");
            description.append("INFORMACIÓN PARA LA IA: No tienes acceso al contenido de vídeo, solo al nombre y metadatos básicos. ");
            description.append("Intenta deducir de qué podría tratar el vídeo y genera un RESUMEN probable del tema y contexto, indicando que es una inferencia.\n");
        } else {
            description.append("Archivo subido por el usuario.\n\n");
            description.append("Nombre de archivo: ").append(originalName).append("\n");
            description.append("Tipo de contenido: ").append(contentType).append("\n");
            description.append("Tamaño aproximado: ")
                    .append(String.format("%.2f MB", file.getSize() / (1024.0 * 1024.0)))
                    .append("\n\n");
            description.append("INFORMACIÓN PARA LA IA: A partir de estos metadatos intenta clasificar el archivo y proponer un título y resumen útiles.\n");
        }

        logger.info("Enviando metadatos de archivo '{}' a la IA para clasificación", originalName);
        ClaudeAIService.ClassificationResult classification = claudeAIService.classifyContent(description.toString());

        // Guardar el archivo físico para poder reproducirlo después desde el navegador
        String storedFilename = mediaStorageService.storeFile(file);
        String basePath = (contextPath != null ? contextPath : "");
        String mediaUrl = basePath + "/api/brain/media/" + storedFilename;

        return new BrainSuggestionDto(
                classification.getType(),
                classification.getTitle() != null ? classification.getTitle() : originalName,
                classification.getSummary(),
                classification.getDetailedContent(),
                classification.getDestination(),
                classification.getTags(),
                mediaUrl,
                contentType);
    }

    @GetMapping("/media/{filename:.+}")
    public ResponseEntity<?> getMedia(@PathVariable("filename") String filename, @RequestHeader HttpHeaders headers) {
        Resource resource = mediaStorageService.loadAsResource(filename);
        MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        // Fallback para casos típicos donde la detección falla (Windows a veces devuelve null)
        String name = resource.getFilename() != null ? resource.getFilename().toLowerCase() : "";
        if (MediaType.APPLICATION_OCTET_STREAM.equals(mediaType)) {
            if (name.endsWith(".mp3")) {
                mediaType = MediaType.parseMediaType("audio/mpeg");
            } else if (name.endsWith(".mp4")) {
                mediaType = MediaType.parseMediaType("video/mp4");
            }
        }

        // Si no hay Range: devolver el recurso completo
        if (headers.getRange() == null || headers.getRange().isEmpty()) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentType(mediaType)
                    .body(resource);
        }

        // Range requests: devolver un trozo del fichero (evita ResourceRegion converter issues)
        Path path;
        try {
            path = resource.getFile().toPath();
        } catch (IOException e) {
            // Si no podemos acceder al fichero físico, devolvemos el recurso completo
            return ResponseEntity.ok()
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentType(mediaType)
                    .body(resource);
        }

        long fileLength;
        try {
            fileLength = Files.size(path);
        } catch (IOException e) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentType(mediaType)
                    .body(resource);
        }

        // Solo soportamos el primer rango
        String rangeHeader = headers.getFirst(HttpHeaders.RANGE);
        if (rangeHeader == null || !rangeHeader.startsWith("bytes=")) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentType(mediaType)
                    .body(resource);
        }

        String rangeValue = rangeHeader.substring("bytes=".length()).trim();
        String[] parts = rangeValue.split("-", 2);
        if (parts.length != 2) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + fileLength)
                    .build();
        }

        long start;
        long end;
        try {
            if (parts[0].isEmpty()) {
                // Sufijo: bytes=-500  -> últimos 500 bytes
                long suffixLength = Long.parseLong(parts[1]);
                if (suffixLength <= 0) {
                    throw new NumberFormatException();
                }
                start = Math.max(0, fileLength - suffixLength);
                end = fileLength - 1;
            } else {
                start = Long.parseLong(parts[0]);
                if (parts[1].isEmpty()) {
                    end = fileLength - 1;
                } else {
                    end = Long.parseLong(parts[1]);
                }
            }
        } catch (NumberFormatException ex) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + fileLength)
                    .build();
        }

        if (start < 0 || start >= fileLength) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + fileLength)
                    .build();
        }

        end = Math.min(end, fileLength - 1);
        if (end < start) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + fileLength)
                    .build();
        }

        // Enviar chunks (1MB máx) para no cargar memoria con ficheros grandes
        long requestedLength = end - start + 1;
        int chunkLength = (int) Math.min(1024L * 1024L, requestedLength);

        byte[] data = new byte[chunkLength];
        int bytesRead;
        try (var is = Files.newInputStream(path)) {
            long skipped = is.skip(start);
            while (skipped < start) {
                long s = is.skip(start - skipped);
                if (s <= 0) break;
                skipped += s;
            }
            bytesRead = is.read(data);
        } catch (IOException e) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentType(mediaType)
                    .body(resource);
        }

        if (bytesRead < 0) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, "bytes */" + fileLength)
                    .build();
        }

        if (bytesRead != data.length) {
            byte[] trimmed = new byte[bytesRead];
            System.arraycopy(data, 0, trimmed, 0, bytesRead);
            data = trimmed;
        }

        long actualEnd = start + data.length - 1;

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + actualEnd + "/" + fileLength)
                .contentLength(data.length)
                .contentType(mediaType)
                .body(data);
    }

    /**
     * Verifica si el contenido es una URL
     */
    private boolean isUrl(String content) {
        if (content == null || content.trim().isEmpty()) {
            return false;
        }
        String trimmed = content.trim().toLowerCase();
        return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("www.");
    }

}
