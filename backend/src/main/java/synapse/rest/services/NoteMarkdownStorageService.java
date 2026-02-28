package synapse.rest.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.Instant;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import synapse.rest.dtos.SaveNoteParamsDto;

/**
 * Almacenamiento abierto: persiste notas como ficheros Markdown en el disco.
 *
 * La idea es que la carpeta sea fácilmente versionable con Git.
 */
@Service
public class NoteMarkdownStorageService {

    private static final Logger logger = LoggerFactory.getLogger(NoteMarkdownStorageService.class);

    private final Path notesDir;

    public NoteMarkdownStorageService(@Value("${project.notes.dir:digital-brain-notes}") String notesDir) {
        this.notesDir = Paths.get(notesDir).normalize();
        try {
            Files.createDirectories(this.notesDir);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo crear el directorio de notas: " + this.notesDir, e);
        }
        logger.info("Directorio de notas Markdown: {}", this.notesDir.toAbsolutePath());
    }

    public SaveResult saveNote(SaveNoteParamsDto params) {
        String noteId = safeString(params.getNoteId());
        if (noteId.isEmpty()) {
            noteId = "note-" + Instant.now().toEpochMilli();
        }

        String title = safeString(params.getTitle());
        if (title.isEmpty()) {
            title = "Nota sin título";
        }

        String createdAt = safeString(params.getCreatedAt());
        if (createdAt.isEmpty()) {
            createdAt = Instant.now().toString();
        }

        String destination = safeString(params.getDestination());
        String type = safeString(params.getType());
        String entryId = safeString(params.getEntryId());
        String mediaUrl = safeString(params.getMediaUrl());
        String mediaContentType = safeString(params.getMediaContentType());

        String filename = buildFilename(createdAt, title, noteId);
        Path filePath = notesDir.resolve(filename).normalize();

        // Defensa: impedir path traversal
        if (!filePath.startsWith(notesDir)) {
            throw new IllegalArgumentException("Nombre de fichero no válido");
        }

        String markdown = buildMarkdown(params, noteId, title, createdAt, destination, type, entryId, mediaUrl,
                mediaContentType);

        try {
            Files.writeString(filePath, markdown, StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo guardar la nota en disco", e);
        }

        return new SaveResult(filename, filename);
    }

    public void deleteByStorageId(String storageId) {
        String safe = safeFilename(storageId);
        if (safe.isEmpty()) {
            return;
        }
        Path filePath = notesDir.resolve(safe).normalize();
        if (!filePath.startsWith(notesDir)) {
            return;
        }

        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Idempotente: no elevamos error al cliente.
            logger.warn("No se pudo borrar la nota {}: {}", safe, e.getMessage());
        }
    }

    private String buildMarkdown(SaveNoteParamsDto params, String noteId, String title, String createdAt,
            String destination, String type, String entryId, String mediaUrl, String mediaContentType) {

        StringBuilder sb = new StringBuilder();

        sb.append("---\n");
        sb.append("id: \"").append(escapeYaml(noteId)).append("\"\n");
        sb.append("title: \"").append(escapeYaml(title)).append("\"\n");
        if (!destination.isEmpty()) {
            sb.append("destination: \"").append(escapeYaml(destination)).append("\"\n");
        }
        if (!type.isEmpty()) {
            sb.append("type: \"").append(escapeYaml(type)).append("\"\n");
        }
        if (!entryId.isEmpty()) {
            sb.append("entryId: \"").append(escapeYaml(entryId)).append("\"\n");
        }
        sb.append("createdAt: \"").append(escapeYaml(createdAt)).append("\"\n");

        if (params.getTags() != null && params.getTags().length > 0) {
            sb.append("tags:\n");
            for (String tag : params.getTags()) {
                String t = safeString(tag);
                if (!t.isEmpty()) {
                    sb.append("  - \"").append(escapeYaml(t)).append("\"\n");
                }
            }
        }

        if (!mediaUrl.isEmpty()) {
            sb.append("mediaUrl: \"").append(escapeYaml(mediaUrl)).append("\"\n");
        }
        if (!mediaContentType.isEmpty()) {
            sb.append("mediaContentType: \"").append(escapeYaml(mediaContentType)).append("\"\n");
        }

        sb.append("---\n\n");

        String content = params.getContent() != null ? params.getContent() : "";
        sb.append(content);
        if (!content.endsWith("\n")) {
            sb.append("\n");
        }

        return sb.toString();
    }

    private String buildFilename(String createdAt, String title, String noteId) {
        String datePart = createdAt.replaceAll("[^0-9]", "");
        if (datePart.length() > 14) {
            datePart = datePart.substring(0, 14);
        }
        if (datePart.isEmpty()) {
            datePart = String.valueOf(Instant.now().toEpochMilli());
        }

        String slug = slugify(title);
        String idPart = safeFilename(noteId);
        if (idPart.isEmpty()) {
            idPart = "note";
        }

        String base = datePart + "-" + slug + "-" + idPart;
        // evitar nombres demasiado largos
        if (base.length() > 180) {
            base = base.substring(0, 180);
        }

        return base + ".md";
    }

    private String slugify(String input) {
        if (input == null) {
            return "nota";
        }
        String s = input.toLowerCase(Locale.ROOT).trim();
        // Normalización simple sin dependencias extra
        s = s.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
                .replace('ü', 'u').replace('ñ', 'n');
        s = s.replaceAll("[^a-z0-9]+", "-");
        s = s.replaceAll("^-+|-+$", "");
        if (s.isEmpty()) {
            return "nota";
        }
        return s;
    }

    private String safeFilename(String input) {
        if (input == null) {
            return "";
        }
        String s = input.trim();
        // permitir solo un conjunto seguro
        s = s.replaceAll("[^a-zA-Z0-9._-]", "");
        // evitar '.' o nombres vacíos
        if (s.equals(".") || s.equals("..")) {
            return "";
        }
        return s;
    }

    private String safeString(String input) {
        if (input == null) {
            return "";
        }
        return input.trim();
    }

    private String escapeYaml(String input) {
        if (input == null) {
            return "";
        }
        return input.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    public static class SaveResult {
        private final String storageId;
        private final String filename;

        public SaveResult(String storageId, String filename) {
            this.storageId = storageId;
            this.filename = filename;
        }

        public String getStorageId() {
            return storageId;
        }

        public String getFilename() {
            return filename;
        }
    }
}
