package synapse.model.services;

import java.io.IOException;
import java.util.List;
import java.util.ArrayList;

import synapse.rest.dtos.FactCheckResponseDto;
import synapse.rest.dtos.TrendsInsightsParamsDto;
import synapse.rest.dtos.TrendsInsightsResponseDto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Service for interacting with the LLaMA API (Groq, OpenAI-compatible
 * format).
 */
@Service
public class LlamaAIService {
    private static final Logger logger = LoggerFactory.getLogger(LlamaAIService.class);
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private final OkHttpClient client;
    private final Gson gson;

    @Value("${project.llama.apiKey:${project.llama.api-key:}}")
    private String apiKey;

    @Value("${project.llama.apiUrl:${project.llama.api-url:}}")
    private String apiUrl;

    @Value("${project.llama.model:}")
    private String model;

    private static final String CONST_CONTENT = "content";
    private static final String CONST_NOTE = "note";
    private static final String CONST_CLAIMS = "claims";

    public LlamaAIService() {
        this.client = new OkHttpClient();
        this.gson = new Gson();
    }

    /**
     * Classifies and analyzes content using LLaMA.
     *
     * @param content the content to analyze
     * @return classification result with suggestions
     */
    public ClassificationResult classifyContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return createDefaultResult();
        }

        logger.info("Classifying content of length: {}", content.length());

        // If no API key is configured, generate basic content from text
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("your-groq-api-key-here")) {
            logger.warn("LLaMA API key not configured, generating basic content");
            return createSmartDefaultResult(content);
        }

        try {
            String prompt = buildClassificationPrompt(content);
            logger.info("Sending prompt to LLaMA, length: {}", prompt.length());
            String response = callLlamaApi(prompt);
            logger.info("Response received from LLaMA, length: {}", response != null ? response.length() : 0);
            if (response == null || response.trim().isEmpty()) {
                logger.warn("Empty response from LLaMA, generating basic content");
                return createSmartDefaultResult(content);
            }
            ClassificationResult result = parseLlamaResponse(response, content);

            // Validate that the result has useful content
            if (result.getTitle().equals("Note") && result.getSummary().isEmpty() &&
                    result.getDetailedContent().contains("Unprocessed content")) {
                logger.warn("Result appears to be default, generating smart content");
                return createSmartDefaultResult(content);
            }

            logger.info("Parsed result - title: '{}', tags: {}", result.getTitle(), result.getTags().length);
            return result;
        } catch (Exception e) {
            logger.error("Error classifying content with LLaMA: {}", e.getMessage(), e);
            return createSmartDefaultResult(content);
        }
    }

    /**
     * Builds the prompt for LLaMA - optimized for better accuracy.
     */
    private String buildClassificationPrompt(String content) {
        String contentPreview = content.substring(0, Math.min(content.length(), 15000));
        boolean isVideo = content.contains("VIDEO") || content.contains("YOUTUBE VIDEO") ||
                content.contains("CHANNEL:") || content.contains("VIDEO TITLE:");

        return "Analyze the following content and generate a JSON classification. " +
                "BE SPECIFIC AND PRECISE. DO NOT use generic tags like 'general'.\n\n" +
                "CONTENT:\n" + contentPreview + "\n\n" +
                "MANDATORY RULES:\n" +
                "1. TITLE: Create a descriptive and specific title based on the actual content (max 120 characters)\n"
                +
                "2. SUMMARY: Detailed summary of 200-800 characters explaining WHAT it teaches, WHAT concepts it covers, WHAT technologies it mentions\n"
                +
                "3. DETAILEDCONTENT: Complete Markdown document (min 500 characters) with:\n" +
                "   - Main title\n" +
                "   - Executive summary\n" +
                "   - Key points by sections\n" +
                "   - Important concepts\n" +
                "   - Technologies/frameworks mentioned\n" +
                "   - Conclusions or takeaways\n" +
                "4. TYPE: 'video', 'article', 'tutorial', 'code', 'documentation', 'research', or 'note'\n" +
                "5. DESTINATION: 'note', 'idea', 'resource', or 'task'\n" +
                "6. TAGS: Array with 4-6 SPECIFIC tags extracted from the content. " +
                "Examples: 'react-hooks', 'spanish-football', 'public-healthcare', 'graph-algorithms'. " +
                "FORBIDDEN: 'general', 'various', 'others', 'technology', 'programming'.\n\n" +
                (isVideo
                        ? "THIS IS A VIDEO: Analyze the title and description to extract specific topics, technologies and concepts.\n\n"
                        : "")
                +
                "Respond ONLY with valid JSON, no additional text:\n" +
                "{\"type\":\"type\",\"title\":\"title\",\"summary\":\"summary\",\"detailedContent\":\"# Title\\n\\n## Summary\\n\\n...\",\"destination\":\"note\",\"tags\":[\"tag1\",\"tag2\",\"tag3\",\"tag4\"]}";
    }

    /**
     * Calls the LLaMA API (Groq - OpenAI-compatible format).
     */
    private String callLlamaApi(String prompt) throws IOException {
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("model", model);
        requestBody.addProperty("max_tokens", 4000);
        requestBody.addProperty("temperature", 0.7);

        logger.info("Calling Groq API: {} with model: {}", apiUrl, model);

        JsonArray messages = new JsonArray();
        JsonObject message = new JsonObject();
        message.addProperty("role", "user");
        message.addProperty("content", prompt);
        messages.add(message);

        requestBody.add("messages", messages);

        RequestBody body = RequestBody.create(requestBody.toString(), JSON);
        Request request = new Request.Builder()
                .url(apiUrl)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                String errorBody = response.body() != null ? response.body().string() : "";
                logger.error("Error in Groq API response: HTTP {} - Body: {}", response.code(), errorBody);
                throw new IOException("Unexpected code: " + response.code() + " - " + errorBody);
            }

            String responseBody = response.body().string();
            logger.info("Successful response from Groq (length: {})", responseBody.length());
            logger.debug("Complete response from Groq: {}", responseBody);
            JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);

            // Extract response content (OpenAI/Groq format)
            JsonArray choices = jsonResponse.getAsJsonArray("choices");
            if (choices != null && choices.size() > 0) {
                JsonObject choice = choices.get(0).getAsJsonObject();
                JsonObject messageObj = choice.getAsJsonObject("message");
                if (messageObj != null && messageObj.has(CONST_CONTENT)) {
                    String responseContent = messageObj.get(CONST_CONTENT).getAsString();
                    logger.debug("Extracted content: {}",
                            responseContent.substring(0, Math.min(responseContent.length(), 200)));
                    return responseContent;
                }
            }

            logger.warn("No content found in Groq response");
            return "";
        }
    }

    /**
     * Parses the LLaMA response.
     */
    private ClassificationResult parseLlamaResponse(String response, String originalContent) {
        try {
            logger.debug("Parseando respuesta, longitud: {}", response.length());

            // Try to extract JSON from the response
            String jsonStr = extractJSON(response);
            logger.debug("Extracted JSON: {}", jsonStr.substring(0, Math.min(jsonStr.length(), 200)));

            JsonObject json = gson.fromJson(jsonStr, JsonObject.class);

            String type = json.has("type") ? json.get("type").getAsString() : CONST_NOTE;
            String title = json.has("title") ? json.get("title").getAsString() : "Note";
            String summary = json.has("summary") ? json.get("summary").getAsString() : "";
            String detailedContent = json.has("detailedContent") ? json.get("detailedContent").getAsString() : "";
            String destination = json.has("destination") ? json.get("destination").getAsString() : CONST_NOTE;

            List<String> tags = new ArrayList<>();
            if (json.has("tags") && json.get("tags").isJsonArray()) {
                JsonArray tagsArray = json.getAsJsonArray("tags");
                for (int i = 0; i < tagsArray.size(); i++) {
                    String tag = tagsArray.get(i).getAsString();
                    // Filter out generic tags
                    if (!tag.equalsIgnoreCase("general") && !tag.equalsIgnoreCase("varios") &&
                            !tag.equalsIgnoreCase("otros") && !tag.trim().isEmpty()) {
                        tags.add(tag);
                    }
                }
            }

            // If no valid tags, try to generate some from content
            if (tags.isEmpty()) {
                tags = generateTagsFromContent(originalContent, title, summary);
            }

            // If no detailedContent, create a detailed one
            if (detailedContent.isEmpty() || detailedContent.length() < 200) {
                detailedContent = buildDetailedContentFromSummary(title, summary, originalContent);
            }

            // Ensure the summary has content
            if (summary.isEmpty() && !originalContent.isEmpty()) {
                summary = originalContent.substring(0, Math.min(originalContent.length(), 500)) + "...";
            }

            logger.debug("Final result - title: '{}', tags: {}, summary length: {}",
                    title, tags.size(), summary.length());

            return new ClassificationResult(type, title, summary, detailedContent, destination,
                    tags.toArray(new String[0]));
        } catch (Exception e) {
            logger.error("Error parsing LLaMA response", e);
            logger.error("Response that caused the error: {}", response);
            return createSmartDefaultResult(originalContent);
        }
    }

    /**
     * Generates basic tags from content when the AI does not provide them.
     */
    private List<String> generateTagsFromContent(String content, String title, String summary) {
        List<String> tags = new ArrayList<>();
        String allText = (title + " " + summary + " " + content).toLowerCase();

        // Detect specific topics
        if (allText.contains("futbol") || allText.contains("fútbol") || allText.contains("deporte") ||
                allText.contains("liga") || allText.contains("equipo")) {
            tags.add("sports");
            if (allText.contains("español") || allText.contains("españa")) {
                tags.add("spanish-football");
            }
        }
        if (allText.contains("sanidad") || allText.contains("salud") || allText.contains("medicina") ||
                allText.contains("mir") || allText.contains("hospital")) {
            tags.add("healthcare");
            if (allText.contains("publica") || allText.contains("pública")) {
                tags.add("public-healthcare");
            }
        }
        if (allText.contains("historia") || allText.contains("histórico") || allText.contains("rey") ||
                allText.contains("23f") || allText.contains("desclasificacion")) {
            tags.add("history");
            tags.add("politics");
        }
        if (allText.contains("tecnologia") || allText.contains("tecnología") || allText.contains("programacion") ||
                allText.contains("software") || allText.contains("aplicacion")) {
            tags.add("technology");
        }
        if (allText.contains("sociedad") || allText.contains("noticia") || allText.contains("actualidad")) {
            tags.add("society");
        }
        if (allText.contains("video") || allText.contains("youtube") || allText.contains("vimeo")) {
            tags.add("video");
        }
        if (allText.contains("articulo") || allText.contains("artículo") || allText.contains("noticia") ||
                allText.contains("cadena ser") || allText.contains("el país")) {
            tags.add("article");
        }

        // Extract keywords from title
        if (title != null && !title.isEmpty()) {
            String[] titleWords = title.toLowerCase().split("[\\s|]+");
            for (String word : titleWords) {
                word = word.replaceAll("[^a-záéíóúñ]", "");
                if (word.length() > 4 && !tags.contains(word) && tags.size() < 6) {
                    // Evitar palabras muy comunes
                    if (!word.equals("sobre") && !word.equals("cuando") && !word.equals("desde") &&
                            !word.equals("hasta") && !word.equals("después") && !word.equals("note")) {
                        tags.add(word);
                    }
                }
            }
        }

        // If still no tags, use a generic but specific one
        if (tags.isEmpty()) {
            tags.add("content");
        }

        return tags;
    }

    /**
     * Builds detailed content when the AI does not provide it.
     */
    private String buildDetailedContentFromSummary(String title, String summary, String originalContent) {
        StringBuilder content = new StringBuilder();
        content.append("# ").append(title).append("\n\n");

        if (!summary.isEmpty()) {
            content.append("## Summary\n\n").append(summary).append("\n\n");
        }

        content.append("## Original content\n\n");
        String preview = originalContent.substring(0, Math.min(originalContent.length(), 2000));
        content.append(preview);
        if (originalContent.length() > 2000) {
            content.append("\n\n... (truncated content)");
        }

        return content.toString();
    }

    /**
     * Extracts JSON from the response (may contain additional text).
     */
    private String extractJSON(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "{}";
        }

        // Find the first { and the last }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');

        if (start != -1 && end != -1 && end > start) {
            String json = text.substring(start, end + 1);
            logger.debug("Extracted JSON: {}", json.substring(0, Math.min(json.length(), 300)));
            return json;
        }

        // If no JSON, try to find it between ```json or ```
        int jsonStart = text.indexOf("```json");
        if (jsonStart != -1) {
            jsonStart += 7; // Longitud de "```json"
            int jsonEnd = text.indexOf("```", jsonStart);
            if (jsonEnd != -1) {
                return text.substring(jsonStart, jsonEnd).trim();
            }
        }

        // Search between ```
        int codeStart = text.indexOf("```");
        if (codeStart != -1) {
            codeStart += 3;
            int codeEnd = text.indexOf("```", codeStart);
            if (codeEnd != -1) {
                String code = text.substring(codeStart, codeEnd).trim();
                if (code.startsWith("{")) {
                    return code;
                }
            }
        }

        logger.warn("Could not extract valid JSON from response");
        return text;
    }

    /**
     * Creates a default result when LLaMA cannot be used.
     */
    private ClassificationResult createDefaultResult() {
        return new ClassificationResult("note", "Note", "",
                "# Note\n\n## Content\n\nUnprocessed content.",
                "note", new String[] { "general" });
    }

    /**
     * Creates a smart result based on content when the AI fails.
     */
    private ClassificationResult createSmartDefaultResult(String content) {
        // Extract title from content
        String title = extractTitleFromContent(content);
        String summary = extractSummaryFromContent(content);
        List<String> tags = generateTagsFromContent(content, title, summary);

        // Build detailed content
        String detailedContent = buildDetailedContentFromSummary(title, summary, content);

        // Detect type
        String type = detectTypeFromContent(content);

        return new ClassificationResult(
                type,
                title,
                summary,
                detailedContent,
                "note",
                tags.toArray(new String[0]));
    }

    /**
     * Extracts a title from content.
     */
    private String extractTitleFromContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return "Note";
        }

        // If there is "Title:" at the beginning, extract it
        if (content.contains("Title:")) {
            int titleStart = content.indexOf("Title:") + 6;
            int titleEnd = content.indexOf("\n", titleStart);
            if (titleEnd == -1)
                titleEnd = Math.min(titleStart + 120, content.length());
            String title = content.substring(titleStart, titleEnd).trim();
            if (!title.isEmpty() && title.length() <= 120) {
                return title;
            }
        }

        // If it is a URL, use part of the URL as title
        if (content.startsWith("http://") || content.startsWith("https://")) {
            try {
                String domain = content.split("/")[2];
                return "Link: " + domain;
            } catch (Exception e) {
                return "Link";
            }
        }

        // Use the first words of the content
        String[] lines = content.split("\n");
        for (String line : lines) {
            line = line.trim();
            if (line.length() > 10 && line.length() <= 120) {
                return line;
            }
        }

        // Last resort: first 120 characters
        String firstLine = content.trim().split("\n")[0];
        if (firstLine.length() > 120) {
            return firstLine.substring(0, 117) + "...";
        }
        return firstLine.isEmpty() ? "Note" : firstLine;
    }

    /**
     * Extracts a summary from content.
     */
    private String extractSummaryFromContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return "";
        }

        // If there is "Description:" or "Summary:", extract it
        String[] keywords = { "Description:", "Summary:", "Summary:" };
        for (String keyword : keywords) {
            if (content.contains(keyword)) {
                int start = content.indexOf(keyword) + keyword.length();
                int end = content.indexOf("\n\n", start);
                if (end == -1)
                    end = Math.min(start + 800, content.length());
                String summary = content.substring(start, end).trim();
                if (summary.length() >= 50) {
                    return summary;
                }
            }
        }

        // Use the first lines as summary
        String[] lines = content.split("\n");
        StringBuilder summary = new StringBuilder();
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("Title:") || line.startsWith("URL:")) {
                continue;
            }
            if (summary.length() + line.length() > 800) {
                break;
            }
            if (summary.length() > 0) {
                summary.append(" ");
            }
            summary.append(line);
            if (summary.length() >= 200) {
                break;
            }
        }

        String result = summary.toString().trim();
        if (result.length() < 50) {
            // If too short, use more content
            result = content.substring(0, Math.min(500, content.length())).trim();
            if (result.length() > 500) {
                result = result.substring(0, 497) + "...";
            }
        }

        return result;
    }

    /**
     * Detects the content type.
     */
    private String detectTypeFromContent(String content) {
        if (content == null)
            return "note";

        String lower = content.toLowerCase();
        if (lower.contains("video") || lower.contains("youtube") || lower.contains("vimeo")) {
            return "video";
        }
        if (content.startsWith("http://") || content.startsWith("https://") || content.startsWith("www.")) {
            return "link";
        }
        if (lower.contains("```") || lower.contains("function") || lower.contains("class ")) {
            return "code";
        }
        if (lower.contains("tutorial") || lower.contains("guía") || lower.contains("paso a paso")) {
            return "tutorial";
        }
        return "article";
    }

    /**
     * Verifies the truthfulness of information in the content.
     * Identifies false or doubtful claims and provides corrections.
     */
    public List<FactCheckResponseDto.ClaimVerification> verifyInformation(String content) {
        if (content == null || content.trim().isEmpty()) {
            return new ArrayList<>();
        }

        logger.info("Verifying information in content of length: {}", content.length());

        try {
            String prompt = buildFactCheckPrompt(content);
            String response = callLlamaApi(prompt);

            if (response == null || response.trim().isEmpty()) {
                return new ArrayList<>();
            }

            return parseFactCheckResponse(response);
        } catch (Exception e) {
            logger.error("Error verifying information with LLaMA: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Generates personalized trend insights using LLaMA, based on:
     * - Topics with counts (recent vs previous)
     * - A sample of real items (title/tags/excerpt)
     *
     * Returns a JSON with more specific labels and insight phrases.
     */
    public TrendsInsightsResponseDto generateTrendsInsights(TrendsInsightsParamsDto params) {
        if (params == null) {
            return new TrendsInsightsResponseDto();
        }

        // If no API key configured, return empty (the frontend will use deterministic fallback)
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("your-groq-api-key-here")) {
            logger.warn("LLaMA API key not configured, returning empty insights");
            return new TrendsInsightsResponseDto();
        }

        try {
            String prompt = buildTrendsInsightsPrompt(params);
            String response = callLlamaApi(prompt);

            if (response == null || response.trim().isEmpty()) {
                return new TrendsInsightsResponseDto();
            }

            String jsonStr = extractJSON(response);
            TrendsInsightsResponseDto dto = gson.fromJson(jsonStr, TrendsInsightsResponseDto.class);
            return dto != null ? dto : new TrendsInsightsResponseDto();
        } catch (Exception e) {
            logger.error("Error generating trend insights with LLaMA: {}", e.getMessage(), e);
            return new TrendsInsightsResponseDto();
        }
    }

    private String buildTrendsInsightsPrompt(TrendsInsightsParamsDto params) {
        JsonObject payload = new JsonObject();
        payload.addProperty("windowDays", params.getWindowDays());

        JsonArray topicsArray = new JsonArray();
        if (params.getTopics() != null) {
            for (TrendsInsightsParamsDto.TopicCountDto t : params.getTopics()) {
                if (t == null) {
                    continue;
                }

                JsonObject o = new JsonObject();
                o.addProperty("topic", t.getTopic());
                o.addProperty("trend", t.getTrend());
                o.addProperty("recentCount", t.getRecentCount() == null ? 0 : t.getRecentCount());
                o.addProperty("previousCount", t.getPreviousCount() == null ? 0 : t.getPreviousCount());
                topicsArray.add(o);
            }
        }
        payload.add("topics", topicsArray);

        JsonArray itemsArray = new JsonArray();
        if (params.getItems() != null) {
            int max = Math.min(params.getItems().size(), 60);
            for (int i = 0; i < max; i++) {
                TrendsInsightsParamsDto.TrendSampleItemDto it = params.getItems().get(i);
                if (it == null) {
                    continue;
                }

                JsonObject o = new JsonObject();
                o.addProperty("createdAt", it.getCreatedAt());
                o.addProperty("type", it.getType());
                o.addProperty("title", it.getTitle());

                if (it.getTags() != null) {
                    JsonArray tags = new JsonArray();
                    for (String tag : it.getTags()) {
                        if (tag != null && !tag.trim().isEmpty()) {
                            tags.add(tag);
                        }
                    }
                    o.add("tags", tags);
                }

                String c = it.getContent();
                if (c != null && c.length() > 600) {
                    c = c.substring(0, 600) + "...";
                }
                o.addProperty("content", c);

                itemsArray.add(o);
            }
        }
        payload.add("items", itemsArray);

        String data = gson.toJson(payload);

        return "Act as a personal trend analyst. I provide a RADAR of topics (recent vs previous counts) and a sample of real items (title/tags/excerpt).\n\n"
                + "OBJECTIVE:\n"
                + "1) Label each topic with a more specific name in English (without making things up).\n"
                + "   - If you detect music, specify the genre/subgenre (e.g. rap, techno, flamenco, reggaeton).\n"
                + "   - If you detect politics, specify the scope (national/international/elections/parties/public policies).\n"
                + "   - If there is not enough evidence, use a general label (e.g. 'music', 'politics').\n"
                + "2) Generate 'insights' (1-3 sentences) and 'recommendations' (1-3) based on the data.\n\n"
                + "DATA (JSON):\n" + data + "\n\n"
                + "RULES:\n"
                + "- Do not make up facts or proper names; if in doubt, be conservative.\n"
                + "- Return ONLY valid JSON, no additional text or markdown.\n\n"
                + "OUTPUT FORMAT:\n"
                + "{\n"
                + "  \"topicLabels\": {\"originalTopic\": \"Specific label\"},\n"
                + "  \"insights\": [\"...\"],\n"
                + "  \"recommendations\": [\"...\"]\n"
                + "}";
    }

    private String buildFactCheckPrompt(String content) {
        return "Act as an expert in fact-checking. Analyze the following content and extract the most important claims that can be objectively verified.\n\n"
                +
                "CONTENT:\n" + content + "\n\n" +
                "RULES:\n" +
                "1. Split the text into individual claims.\n" +
                "2. Evaluate each claim as 'true', 'false', or 'suspicious' (doubtful/no clear consensus).\n"
                +
                "3. For each 'false' or 'suspicious', provide a detailed explanation of why and a corrected version of the information.\n"
                +
                "4. If the claim is 'true', the explanation can be brief and no correction is required.\n\n" +
                "Respond EXCLUSIVELY with a JSON in this format:\n" +
                "{\n" +
                "  \"claims\": [\n" +
                "    {\n" +
                "      \"originalText\": \"text of the claim\",\n" +
                "      \"status\": \"true|false|suspicious\",\n" +
                "      \"explanation\": \"detailed explanation\",\n" +
                "      \"correction\": \"corrected version\"\n" +
                "    }\n" +
                "  ]\n" +
                "}";
    }

    private List<FactCheckResponseDto.ClaimVerification> parseFactCheckResponse(String response) {
        List<FactCheckResponseDto.ClaimVerification> results = new ArrayList<>();
        try {
            String jsonStr = extractJSON(response);
            JsonObject json = gson.fromJson(jsonStr, JsonObject.class);

            if (json.has(CONST_CLAIMS) && json.get(CONST_CLAIMS).isJsonArray()) {
                JsonArray claimsArray = json.getAsJsonArray(CONST_CLAIMS);
                for (int i = 0; i < claimsArray.size(); i++) {
                    JsonObject claimJson = claimsArray.get(i).getAsJsonObject();
                    results.add(new FactCheckResponseDto.ClaimVerification(
                            claimJson.has("originalText") ? claimJson.get("originalText").getAsString() : "",
                            claimJson.has("status") ? claimJson.get("status").getAsString() : "suspicious",
                            claimJson.has("explanation") ? claimJson.get("explanation").getAsString() : "",
                            claimJson.has("correction") ? claimJson.get("correction").getAsString() : ""));
                }
            }
        } catch (Exception e) {
            logger.error("Error parsing fact-check response", e);
        }
        return results;
    }

    public static class ClassificationResult {
        private String type;
        private String title;
        private String summary;
        private String detailedContent;
        private String destination;
        private String[] tags;

        public ClassificationResult(String type, String title, String summary, String destination, String[] tags) {
            this.type = type;
            this.title = title;
            this.summary = summary;
            this.destination = destination;
            this.tags = tags;
        }

        public ClassificationResult(String type, String title, String summary, String detailedContent,
                String destination, String[] tags) {
            this.type = type;
            this.title = title;
            this.summary = summary;
            this.detailedContent = detailedContent;
            this.destination = destination;
            this.tags = tags;
        }

        public String getType() {
            return type;
        }

        public String getTitle() {
            return title;
        }

        public String getSummary() {
            return summary;
        }

        public String getDestination() {
            return destination;
        }

        public String[] getTags() {
            return tags;
        }

        public String getDetailedContent() {
            return detailedContent;
        }

        public void setDetailedContent(String detailedContent) {
            this.detailedContent = detailedContent;
        }
    }
}
