package es.udc.fi.dc.fd.rest.services;

import java.io.IOException;
import java.net.URL;
import java.util.regex.Pattern;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

/**
 * Servicio para extraer contenido de URLs (páginas web, videos, etc.)
 */
@Service
public class ContentExtractionService {

    private static final int TIMEOUT_MS = 10000;
    private static final int MAX_CONTENT_LENGTH = 50000; // Limitar contenido extraído

    /**
     * Extrae el contenido de una URL
     * 
     * @param urlString La URL de la que extraer contenido
     * @return Objeto con el contenido extraído y metadatos
     */
    public ExtractedContent extractContent(String urlString) {
        if (urlString == null || urlString.trim().isEmpty()) {
            return new ExtractedContent("", "", "", "text");
        }

        urlString = urlString.trim();

        // Detectar tipo de contenido
        String contentType = detectContentType(urlString);

        try {
            if (contentType.equals("video")) {
                return extractVideoContent(urlString);
            } else if (contentType.equals("link")) {
                return extractWebPageContent(urlString);
            } else {
                return new ExtractedContent(urlString, "", urlString, "text");
            }
        } catch (Exception e) {
            // Si falla la extracción, devolvemos la URL original
            return new ExtractedContent(urlString, "", "Error al extraer contenido: " + e.getMessage(), contentType);
        }
    }

    /**
     * Detecta el tipo de contenido basándose en la URL
     */
    private String detectContentType(String url) {
        String lower = url.toLowerCase();
        
        if (lower.contains("youtube.com") || lower.contains("youtu.be")) {
            return "video";
        }
        if (lower.contains("vimeo.com")) {
            return "video";
        }
        if (lower.contains("tiktok.com")) {
            return "video";
        }
        if (lower.startsWith("http://") || lower.startsWith("https://")) {
            return "link";
        }
        
        return "text";
    }

    /**
     * Extrae contenido de una página web
     */
    private ExtractedContent extractWebPageContent(String urlString) throws IOException {
        Document doc = Jsoup.connect(urlString)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .timeout(TIMEOUT_MS)
                .followRedirects(true)
                .get();

        // Extraer título
        String title = "";
        Element titleElement = doc.selectFirst("title");
        if (titleElement != null) {
            title = titleElement.text();
        }

        // Extraer meta descripción
        String description = "";
        Element metaDesc = doc.selectFirst("meta[name=description]");
        if (metaDesc != null) {
            description = metaDesc.attr("content");
        } else {
            // Intentar con Open Graph
            Element ogDesc = doc.selectFirst("meta[property=og:description]");
            if (ogDesc != null) {
                description = ogDesc.attr("content");
            }
        }

        // Extraer contenido principal
        StringBuilder content = new StringBuilder();
        
        // Intentar encontrar el contenido principal
        Element mainContent = doc.selectFirst("main, article, [role=main], .content, .post, .entry-content");
        if (mainContent != null) {
            // Remover scripts, estilos y otros elementos no deseados
            mainContent.select("script, style, nav, header, footer, aside, .advertisement, .ad").remove();
            content.append(mainContent.text());
        } else {
            // Si no hay contenido principal, usar el body
            Element body = doc.body();
            if (body != null) {
                body.select("script, style, nav, header, footer, aside").remove();
                content.append(body.text());
            }
        }

        String contentText = content.toString();
        if (contentText.length() > MAX_CONTENT_LENGTH) {
            contentText = contentText.substring(0, MAX_CONTENT_LENGTH) + "...";
        }

        // Si no hay título, usar la URL
        if (title.isEmpty()) {
            title = urlString;
        }

        return new ExtractedContent(title, description, contentText, "link");
    }

    /**
     * Extrae información de videos (YouTube, Vimeo, etc.)
     */
    private ExtractedContent extractVideoContent(String urlString) throws IOException {
        String title = "";
        String description = "";
        String content = "";

        try {
            // Para YouTube, intentar extraer información de la página
            if (urlString.contains("youtube.com") || urlString.contains("youtu.be")) {
                Document doc = Jsoup.connect(urlString)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                        .timeout(TIMEOUT_MS)
                        .followRedirects(true)
                        .get();

                Element titleElement = doc.selectFirst("meta[property=og:title]");
                if (titleElement != null) {
                    title = titleElement.attr("content");
                }

                Element descElement = doc.selectFirst("meta[property=og:description]");
                if (descElement != null) {
                    description = descElement.attr("content");
                }

                content = "Video: " + title + "\n\n" + description;
            } else {
                // Para otros videos, intentar extraer información básica
                Document doc = Jsoup.connect(urlString)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                        .timeout(TIMEOUT_MS)
                        .followRedirects(true)
                        .get();

                Element titleElement = doc.selectFirst("title");
                if (titleElement != null) {
                    title = titleElement.text();
                }

                content = "Video: " + title + "\n\nURL: " + urlString;
            }
        } catch (Exception e) {
            title = "Video";
            content = "Video URL: " + urlString;
        }

        return new ExtractedContent(title, description, content, "video");
    }

    /**
     * Clase para almacenar el contenido extraído
     */
    public static class ExtractedContent {
        private String title;
        private String description;
        private String content;
        private String type;

        public ExtractedContent(String title, String description, String content, String type) {
            this.title = title;
            this.description = description;
            this.content = content;
            this.type = type;
        }

        public String getTitle() {
            return title;
        }

        public String getDescription() {
            return description;
        }

        public String getContent() {
            return content;
        }

        public String getType() {
            return type;
        }
    }
}
