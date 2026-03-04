package synapse.model.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.IOException;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

/**
 * Service for extracting content from URLs (web pages, videos, etc.)
 */
@Service
public class ContentExtractionService {
    private static final Logger logger = LoggerFactory.getLogger(ContentExtractionService.class);

    private static final int TIMEOUT_MS = 10000;
    private static final int MAX_CONTENT_LENGTH = 50000; // Limit extracted content

    /**
     * Extracts content from a URL.
     * 
     * @param urlString the URL to extract content from
     * @return object with extracted content and metadata
     */
    public ExtractedContent extractContent(String urlString) {
        if (urlString == null || urlString.trim().isEmpty()) {
            return new ExtractedContent("", "", "", "text");
        }

        urlString = urlString.trim();

        // Detect content type
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
            logger.error("Error extracting content from URL {}: {}", urlString, e.getMessage(), e);
            // If extraction fails, return the original URL
            return new ExtractedContent(urlString, "", "Error extracting content: " + e.getMessage(), contentType);
        }
    }

    /**
     * Detects the content type based on the URL.
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
     * Extracts content from a web page.
     */
    private ExtractedContent extractWebPageContent(String urlString) throws IOException {
        Document doc = Jsoup.connect(urlString)
                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .timeout(TIMEOUT_MS)
                .followRedirects(true)
                .get();

        logger.info("Web page connected: {}. Title: {}", urlString, doc.title());

        // Extract title
        String title = "";
        Element titleElement = doc.selectFirst("title");
        if (titleElement != null) {
            title = titleElement.text();
        }

        // Extract meta description
        String description = "";
        Element metaDesc = doc.selectFirst("meta[name=description]");
        if (metaDesc != null) {
            description = metaDesc.attr("content");
        } else {
            // Try with Open Graph
            Element ogDesc = doc.selectFirst("meta[property=og:description]");
            if (ogDesc != null) {
                description = ogDesc.attr("content");
            }
        }

        // Extract main content
        StringBuilder content = new StringBuilder();

        // Try to find the main content
        Element mainContent = doc.selectFirst("main, article, [role=main], .content, .post, .entry-content");
        if (mainContent != null) {
            // Remove scripts, styles, and other unwanted elements
            mainContent.select("script, style, nav, header, footer, aside, .advertisement, .ad").remove();
            content.append(mainContent.text());
        } else {
            // If no main content, use body
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

        // If no title, use the URL
        if (title.isEmpty()) {
            title = urlString;
        }

        return new ExtractedContent(title, description, contentText, "link");
    }

    /**
     * Extracts video information (YouTube, Vimeo, etc.).
     */
    private ExtractedContent extractVideoContent(String urlString) throws IOException {
        String title = "";
        String description = "";
        String content = "";

        try {
            // For YouTube, try to extract complete information from the page
            if (urlString.contains("youtube.com") || urlString.contains("youtu.be")) {
                Document doc = Jsoup.connect(urlString)
                        .userAgent(
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                        .timeout(TIMEOUT_MS)
                        .followRedirects(true)
                        .get();

                logger.info("YouTube video connected: {}. Title: {}", urlString, doc.title());

                // Extract title (multiple sources)
                Element ogTitle = doc.selectFirst("meta[property=og:title]");
                if (ogTitle != null) {
                    title = ogTitle.attr("content");
                }
                if (title.isEmpty()) {
                    Element titleTag = doc.selectFirst("title");
                    if (titleTag != null) {
                        title = titleTag.text().replace(" - YouTube", "").trim();
                    }
                }

                // Extract description (multiple sources)
                Element ogDesc = doc.selectFirst("meta[property=og:description]");
                if (ogDesc != null) {
                    description = ogDesc.attr("content");
                }
                if (description.isEmpty()) {
                    Element metaDesc = doc.selectFirst("meta[name=description]");
                    if (metaDesc != null) {
                        description = metaDesc.attr("content");
                    }
                }

                // Extract channel information
                String channelName = "";
                Element channelElement = doc.selectFirst("link[itemprop=name]");
                if (channelElement != null) {
                    channelName = channelElement.attr("content");
                }
                if (channelName.isEmpty()) {
                    Element channelLink = doc.selectFirst("a[href*=/channel/], a[href*=/user/], a[href*=/c/]");
                    if (channelLink != null) {
                        channelName = channelLink.text().trim();
                    }
                }

                // Build complete content with all available information
                StringBuilder fullContent = new StringBuilder();
                fullContent.append("YOUTUBE VIDEO\n");
                fullContent.append("==================\n\n");

                if (!title.isEmpty()) {
                    fullContent.append("VIDEO TITLE: ").append(title).append("\n\n");
                }

                if (!channelName.isEmpty()) {
                    fullContent.append("CHANNEL: ").append(channelName).append("\n\n");
                }

                if (!description.isEmpty()) {
                    fullContent.append("VIDEO DESCRIPTION:\n");
                    fullContent.append(description).append("\n\n");
                }

                fullContent.append("URL: ").append(urlString).append("\n");

                // Try to extract additional information from JSON-LD scripts
                Elements jsonLdScripts = doc.select("script[type=application/ld+json]");
                for (Element script : jsonLdScripts) {
                    String jsonContent = script.html();
                    if (jsonContent.contains("VideoObject")) {
                        // If there is structured information, it could be extracted here
                        fullContent.append("\n[Structured video information available]");
                        break;
                    }
                }

                content = fullContent.toString();

                // If we don't have a title, use the URL
                if (title.isEmpty()) {
                    title = "YouTube Video";
                }
            } else {
                // For other videos (Vimeo, etc.), try to extract basic information
                Document doc = Jsoup.connect(urlString)
                        .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                        .timeout(TIMEOUT_MS)
                        .followRedirects(true)
                        .get();

                Element titleElement = doc.selectFirst("title");
                if (titleElement != null) {
                    title = titleElement.text();
                }

                Element descElement = doc.selectFirst("meta[property=og:description]");
                if (descElement != null) {
                    description = descElement.attr("content");
                }

                content = "VIDEO\n" +
                        "TITLE: " + title + "\n\n" +
                        "DESCRIPTION: " + description + "\n\n" +
                        "URL: " + urlString;
            }
        } catch (Exception e) {
            title = "Video";
            content = "VIDEO\nURL: " + urlString + "\n\nError extracting complete information: " + e.getMessage();
        }

        return new ExtractedContent(title, description, content, "video");
    }

    /**
     * Class for storing extracted content.
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
