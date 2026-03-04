package synapse.model.services;

import java.io.IOException;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service that orchestrates content suggestion workflows.
 * Encapsulates URL validation, content extraction, and AI classification.
 */
@Service
public class BrainSuggestionService {

    private static final Logger logger = LoggerFactory.getLogger(BrainSuggestionService.class);

    private final ContentExtractionService contentExtractionService;
    private final LlamaAIService llamaAIService;
    private final MediaStorageService mediaStorageService;

    public BrainSuggestionService(ContentExtractionService contentExtractionService,
            LlamaAIService llamaAIService,
            MediaStorageService mediaStorageService) {
        this.contentExtractionService = contentExtractionService;
        this.llamaAIService = llamaAIService;
        this.mediaStorageService = mediaStorageService;
    }

    /**
     * Orchestrates content suggestion: URL detection → extraction → AI
     * classification.
     */
    public SuggestionResult suggest(String rawContent) {
        String inputContent = rawContent == null ? "" : rawContent.trim();

        if (inputContent.isEmpty()) {
            return new SuggestionResult("nota", "Nota", "", "", "apunte", new String[] { "general" });
        }

        // 1. Extract content if it is a URL
        String contentToAnalyze = inputContent;
        ContentExtractionService.ExtractedContent extracted = null;

        if (isUrl(inputContent)) {
            String urlToExtract = normalizeUrl(inputContent);
            try {
                validateExternalUrl(urlToExtract);
                extracted = contentExtractionService.extractContent(urlToExtract);
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
                if (contentToAnalyze.trim().isEmpty()) {
                    contentToAnalyze = inputContent;
                }
            } catch (Exception e) {
                logger.error("Error al extraer contenido de la URL {}: {}", inputContent, e.getMessage());
                contentToAnalyze = inputContent;
            }
            logger.info("Contenido extraído de URL: {}", contentToAnalyze);
        }

        // 2. AI classification
        logger.info("Enviando contenido a la IA para clasificación...");
        LlamaAIService.ClassificationResult classification = llamaAIService.classifyContent(contentToAnalyze);

        // 3. Merge extraction and AI results
        String finalTitle = classification.getTitle();
        if (extracted != null && !extracted.getTitle().isEmpty() &&
                (finalTitle == null || finalTitle.isEmpty() || finalTitle.equals("Nota"))) {
            finalTitle = extracted.getTitle();
        }

        String finalType = classification.getType();
        if (extracted != null && extracted.getType() != null && !extracted.getType().equals("text")) {
            finalType = extracted.getType();
        }

        return new SuggestionResult(
                finalType,
                finalTitle != null ? finalTitle : "Nota",
                classification.getSummary(),
                classification.getDetailedContent(),
                classification.getDestination(),
                classification.getTags());
    }

    /**
     * Processes a file upload: stores the file, classifies via AI, and returns
     * result.
     *
     * @param file           the uploaded file
     * @param mediaUrlPrefix the base URL path for media (e.g.,
     *                       contextPath + "/api/brain/media/")
     * @return suggestion result including mediaUrl
     */
    public SuggestionResult suggestFromFile(MultipartFile file, String mediaUrlPrefix) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No se ha enviado ningún archivo");
        }

        String rawName = file.getOriginalFilename();
        String originalName = rawName != null ? rawName : "archivo";
        String lowerName = originalName.toLowerCase();
        String rawContentType = file.getContentType();
        String contentType = rawContentType != null ? rawContentType : "";

        boolean isAudio = contentType.startsWith("audio/") || lowerName.endsWith(".mp3")
                || lowerName.endsWith(".wav");
        boolean isVideo = contentType.startsWith("video/") || lowerName.endsWith(".mp4")
                || lowerName.endsWith(".mov");

        StringBuilder description = new StringBuilder();

        if (isAudio) {
            description.append("Archivo de audio subido por el usuario (probablemente un MP3).\n\n");
            description.append("Nombre de archivo: ").append(originalName).append("\n");
            description.append("Tamaño aproximado: ")
                    .append(String.format("%.2f MB", file.getSize() / (1024.0 * 1024.0)))
                    .append("\n\n");
            description.append(
                    "INFORMACIÓN PARA LA IA: A partir del nombre del archivo y estos metadatos, intenta deducir artista, autor o grupo probable, ");
            description.append(
                    "así como el estilo o temática del audio. Si el nombre no da pistas claras, indícalo explícitamente.\n");
        } else if (isVideo) {
            description.append("Archivo de vídeo subido por el usuario (por ejemplo, MP4).\n\n");
            description.append("Nombre de archivo: ").append(originalName).append("\n");
            description.append("Tamaño aproximado: ")
                    .append(String.format("%.2f MB", file.getSize() / (1024.0 * 1024.0)))
                    .append("\n\n");
            description.append(
                    "INFORMACIÓN PARA LA IA: No tienes acceso al contenido de vídeo, solo al nombre y metadatos básicos. ");
            description.append(
                    "Intenta deducir de qué podría tratar el vídeo y genera un RESUMEN probable del tema y contexto, indicando que es una inferencia.\n");
        } else {
            description.append("Archivo subido por el usuario.\n\n");
            description.append("Nombre de archivo: ").append(originalName).append("\n");
            description.append("Tipo de contenido: ").append(contentType).append("\n");
            description.append("Tamaño aproximado: ")
                    .append(String.format("%.2f MB", file.getSize() / (1024.0 * 1024.0)))
                    .append("\n\n");
            description.append(
                    "INFORMACIÓN PARA LA IA: A partir de estos metadatos intenta clasificar el archivo y proponer un título y resumen útiles.\n");
        }

        logger.info("Enviando metadatos de archivo '{}' a la IA para clasificación", originalName);
        LlamaAIService.ClassificationResult classification = llamaAIService.classifyContent(description.toString());

        String finalType = classification.getType();
        if (isAudio) {
            finalType = "audio";
        } else if (isVideo) {
            finalType = "video";
        }

        // Store file and build media URL
        String storedFilename = mediaStorageService.storeFile(file);
        String mediaUrl = mediaUrlPrefix + storedFilename;

        return new SuggestionResult(
                finalType,
                classification.getTitle() != null ? classification.getTitle() : originalName,
                classification.getSummary(),
                classification.getDetailedContent(),
                classification.getDestination(),
                classification.getTags(),
                mediaUrl,
                contentType);
    }

    /**
     * Extracts a link preview: title, description, and content snippet.
     */
    public LinkPreviewResult extractLinkPreview(String url) {
        String normalized = normalizeUrl(url);
        validateExternalUrl(normalized);

        ContentExtractionService.ExtractedContent extracted = contentExtractionService.extractContent(normalized);
        String title = extracted != null ? safe(extracted.getTitle()) : "";
        String desc = extracted != null ? safe(extracted.getDescription()) : "";
        String type = extracted != null ? safe(extracted.getType()) : "link";
        String content = extracted != null ? safe(extracted.getContent()) : "";

        String snippet = content;
        int max = 1200;
        if (snippet.length() > max) {
            snippet = snippet.substring(0, max) + "...";
        }

        return new LinkPreviewResult(normalized, type, title, desc, snippet);
    }

    // ── URL validation helpers ──────────────────────────────────────────

    public boolean isUrl(String content) {
        if (content == null || content.trim().isEmpty()) {
            return false;
        }
        String trimmed = content.trim().toLowerCase();
        return trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("www.");
    }

    public String normalizeUrl(String url) {
        if (url == null) {
            return "";
        }
        String trimmed = url.trim();
        if (trimmed.toLowerCase().startsWith("www.")) {
            return "http://" + trimmed;
        }
        return trimmed;
    }

    public void validateExternalUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            throw new IllegalArgumentException("URL vacía");
        }

        URI uri;
        try {
            uri = new URI(url);
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("URL no válida");
        }

        String scheme = uri.getScheme() != null ? uri.getScheme().toLowerCase() : "";
        if (!scheme.equals("http") && !scheme.equals("https")) {
            throw new IllegalArgumentException("Solo se permiten URLs http/https");
        }

        String host = uri.getHost();
        if (host == null || host.trim().isEmpty()) {
            throw new IllegalArgumentException("URL sin host");
        }

        String lowerHost = host.toLowerCase();
        if (lowerHost.equals("localhost") || lowerHost.endsWith(".localhost")) {
            throw new IllegalArgumentException("Host no permitido");
        }

        try {
            InetAddress[] addrs = InetAddress.getAllByName(host);
            for (InetAddress addr : addrs) {
                if (addr.isAnyLocalAddress() || addr.isLoopbackAddress() || addr.isSiteLocalAddress()
                        || addr.isLinkLocalAddress() || addr.isMulticastAddress()) {
                    throw new IllegalArgumentException("Host no permitido");
                }
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("No se pudo resolver el host");
        }
    }

    private String safe(String s) {
        return s == null ? "" : s.trim();
    }

    // ── Result classes ──────────────────────────────────────────────────

    public static class SuggestionResult {
        private final String type;
        private final String title;
        private final String summary;
        private final String detailedContent;
        private final String destination;
        private final String[] tags;
        private final String mediaUrl;
        private final String mediaContentType;

        public SuggestionResult(String type, String title, String summary, String detailedContent,
                String destination, String[] tags) {
            this(type, title, summary, detailedContent, destination, tags, null, null);
        }

        public SuggestionResult(String type, String title, String summary, String detailedContent,
                String destination, String[] tags, String mediaUrl, String mediaContentType) {
            this.type = type;
            this.title = title;
            this.summary = summary;
            this.detailedContent = detailedContent;
            this.destination = destination;
            this.tags = tags;
            this.mediaUrl = mediaUrl;
            this.mediaContentType = mediaContentType;
        }

        public String getType() { return type; }
        public String getTitle() { return title; }
        public String getSummary() { return summary; }
        public String getDetailedContent() { return detailedContent; }
        public String getDestination() { return destination; }
        public String[] getTags() { return tags; }
        public String getMediaUrl() { return mediaUrl; }
        public String getMediaContentType() { return mediaContentType; }
    }

    public static class LinkPreviewResult {
        private final String url;
        private final String type;
        private final String title;
        private final String description;
        private final String contentSnippet;

        public LinkPreviewResult(String url, String type, String title, String description, String contentSnippet) {
            this.url = url;
            this.type = type;
            this.title = title;
            this.description = description;
            this.contentSnippet = contentSnippet;
        }

        public String getUrl() { return url; }
        public String getType() { return type; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public String getContentSnippet() { return contentSnippet; }
    }
}
