package synapse.rest.services;

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
 * Servicio para interactuar con la API de LLaMA (Groq, formato OpenAI
 * compatible).
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
    private static final String CONST_APUNTE = "apunte";
    private static final String CONST_VIDEO = "video";
    private static final String CONST_CLAIMS = "claims";
    private static final String CONST_NOTA = "nota";

    public LlamaAIService() {
        this.client = new OkHttpClient();
        this.gson = new Gson();
    }

    /**
     * Clasifica y analiza contenido usando LLaMA.
     *
     * @param content El contenido a analizar
     * @return Resultado de la clasificación con sugerencias
     */
    public ClassificationResult classifyContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return createDefaultResult();
        }

        logger.info("Clasificando contenido de longitud: {}", content.length());

        // Si no hay API key configurada, generar contenido básico del texto
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("your-groq-api-key-here")) {
            logger.warn("API key de LLaMA no configurada, generando contenido básico");
            return createSmartDefaultResult(content);
        }

        try {
            String prompt = buildClassificationPrompt(content);
            logger.info("Enviando prompt a LLaMA, longitud: {}", prompt.length());
            String response = callLlamaApi(prompt);
            logger.info("Respuesta recibida de LLaMA, longitud: {}", response != null ? response.length() : 0);
            if (response == null || response.trim().isEmpty()) {
                logger.warn("Respuesta vacía de LLaMA, generando contenido básico");
                return createSmartDefaultResult(content);
            }
            ClassificationResult result = parseLlamaResponse(response, content);

            // Validar que el resultado tenga contenido útil
            if (result.getTitle().equals("Nota") && result.getSummary().isEmpty() &&
                    result.getDetailedContent().contains("Contenido sin procesar")) {
                logger.warn("Resultado parece ser por defecto, generando contenido inteligente");
                return createSmartDefaultResult(content);
            }

            logger.info("Resultado parseado - título: '{}', tags: {}", result.getTitle(), result.getTags().length);
            return result;
        } catch (Exception e) {
            logger.error("Error al clasificar contenido con LLaMA: {}", e.getMessage(), e);
            return createSmartDefaultResult(content);
        }
    }

    /**
     * Construye el prompt para LLaMA - optimizado para mejor precisión.
     */
    private String buildClassificationPrompt(String content) {
        String contentPreview = content.substring(0, Math.min(content.length(), 15000));
        boolean isVideo = content.contains("VIDEO") || content.contains("VIDEO DE YOUTUBE") ||
                content.contains("CANAL:") || content.contains("TÍTULO DEL VIDEO:");

        return "Analiza el siguiente contenido y genera un JSON con la clasificación. " +
                "SÉ ESPECÍFICO Y PRECISO. NO uses etiquetas genéricas como 'general'.\n\n" +
                "CONTENIDO:\n" + contentPreview + "\n\n" +
                "REGLAS OBLIGATORIAS:\n" +
                "1. TÍTULO: Crea un título descriptivo y específico basado en el contenido real (máx 120 caracteres)\n"
                +
                "2. SUMMARY: Resumen detallado de 200-800 caracteres explicando QUÉ enseña, QUÉ conceptos cubre, QUÉ tecnologías menciona\n"
                +
                "3. DETAILEDCONTENT: Documento Markdown completo (mín 500 caracteres) con:\n" +
                "   - Título principal\n" +
                "   - Resumen ejecutivo\n" +
                "   - Puntos clave por secciones\n" +
                "   - Conceptos importantes\n" +
                "   - Tecnologías/frameworks mencionados\n" +
                "   - Conclusiones o takeaways\n" +
                "4. TYPE: 'video', 'articulo', 'tutorial', 'codigo', 'documentacion', 'investigacion', o 'nota'\n" +
                "5. DESTINATION: 'apunte', 'idea', 'recurso', o 'tarea'\n" +
                "6. TAGS: Array con 4-6 etiquetas ESPECÍFICAS extraídas del contenido. " +
                "Ejemplos: 'react-hooks', 'futbol-espanol', 'sanidad-publica', 'algoritmos-grafos'. " +
                "PROHIBIDO usar 'general', 'varios', 'otros', 'tecnologia', 'programacion'.\n\n" +
                (isVideo
                        ? "ES UN VIDEO: Analiza el título y descripción para extraer temas, tecnologías y conceptos específicos.\n\n"
                        : "")
                +
                "Responde SOLO con JSON válido, sin texto adicional:\n" +
                "{\"type\":\"tipo\",\"title\":\"título\",\"summary\":\"resumen\",\"detailedContent\":\"# Título\\n\\n## Resumen\\n\\n...\",\"destination\":\"apunte\",\"tags\":[\"tag1\",\"tag2\",\"tag3\",\"tag4\"]}";
    }

    /**
     * Llama a la API de LLaMA (Groq - formato OpenAI compatible)
     */
    private String callLlamaApi(String prompt) throws IOException {
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("model", model);
        requestBody.addProperty("max_tokens", 4000);
        requestBody.addProperty("temperature", 0.7);

        logger.info("Llamando a la API de Groq: {} con modelo: {}", apiUrl, model);

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
                logger.error("Error en respuesta de Groq API: HTTP {} - Body: {}", response.code(), errorBody);
                throw new IOException("Unexpected code: " + response.code() + " - " + errorBody);
            }

            String responseBody = response.body().string();
            logger.info("Respuesta exitosa de Groq (longitud: {})", responseBody.length());
            logger.debug("Respuesta completa de Groq: {}", responseBody);
            JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);

            // Extraer el contenido de la respuesta (formato OpenAI/Groq)
            JsonArray choices = jsonResponse.getAsJsonArray("choices");
            if (choices != null && choices.size() > 0) {
                JsonObject choice = choices.get(0).getAsJsonObject();
                JsonObject messageObj = choice.getAsJsonObject("message");
                if (messageObj != null && messageObj.has(CONST_CONTENT)) {
                    String responseContent = messageObj.get(CONST_CONTENT).getAsString();
                    logger.debug("Contenido extraído: {}",
                            responseContent.substring(0, Math.min(responseContent.length(), 200)));
                    return responseContent;
                }
            }

            logger.warn("No se encontró contenido en la respuesta de Groq");
            return "";
        }
    }

    /**
     * Parsea la respuesta de LLaMA
     */
    private ClassificationResult parseLlamaResponse(String response, String originalContent) {
        try {
            logger.debug("Parseando respuesta, longitud: {}", response.length());

            // Intentar extraer JSON de la respuesta
            String jsonStr = extractJSON(response);
            logger.debug("JSON extraído: {}", jsonStr.substring(0, Math.min(jsonStr.length(), 200)));

            JsonObject json = gson.fromJson(jsonStr, JsonObject.class);

            String type = json.has("type") ? json.get("type").getAsString() : CONST_NOTA;
            String title = json.has("title") ? json.get("title").getAsString() : "Nota";
            String summary = json.has("summary") ? json.get("summary").getAsString() : "";
            String detailedContent = json.has("detailedContent") ? json.get("detailedContent").getAsString() : "";
            String destination = json.has("destination") ? json.get("destination").getAsString() : CONST_APUNTE;

            List<String> tags = new ArrayList<>();
            if (json.has("tags") && json.get("tags").isJsonArray()) {
                JsonArray tagsArray = json.getAsJsonArray("tags");
                for (int i = 0; i < tagsArray.size(); i++) {
                    String tag = tagsArray.get(i).getAsString();
                    // Filtrar etiquetas genéricas
                    if (!tag.equalsIgnoreCase("general") && !tag.equalsIgnoreCase("varios") &&
                            !tag.equalsIgnoreCase("otros") && !tag.trim().isEmpty()) {
                        tags.add(tag);
                    }
                }
            }

            // Si no hay tags válidas, intentar generar algunas del contenido
            if (tags.isEmpty()) {
                tags = generateTagsFromContent(originalContent, title, summary);
            }

            // Si no hay detailedContent, crear uno detallado
            if (detailedContent.isEmpty() || detailedContent.length() < 200) {
                detailedContent = buildDetailedContentFromSummary(title, summary, originalContent);
            }

            // Asegurar que el summary tenga contenido
            if (summary.isEmpty() && !originalContent.isEmpty()) {
                summary = originalContent.substring(0, Math.min(originalContent.length(), 500)) + "...";
            }

            logger.debug("Resultado final - título: '{}', tags: {}, summary length: {}",
                    title, tags.size(), summary.length());

            return new ClassificationResult(type, title, summary, detailedContent, destination,
                    tags.toArray(new String[0]));
        } catch (Exception e) {
            logger.error("Error al parsear respuesta de LLaMA", e);
            logger.error("Respuesta que causó el error: {}", response);
            return createSmartDefaultResult(originalContent);
        }
    }

    /**
     * Genera etiquetas básicas del contenido cuando la IA no las proporciona
     */
    private List<String> generateTagsFromContent(String content, String title, String summary) {
        List<String> tags = new ArrayList<>();
        String allText = (title + " " + summary + " " + content).toLowerCase();

        // Detectar temas específicos
        if (allText.contains("futbol") || allText.contains("fútbol") || allText.contains("deporte") ||
                allText.contains("liga") || allText.contains("equipo")) {
            tags.add("deportes");
            if (allText.contains("español") || allText.contains("españa")) {
                tags.add("futbol-espanol");
            }
        }
        if (allText.contains("sanidad") || allText.contains("salud") || allText.contains("medicina") ||
                allText.contains("mir") || allText.contains("hospital")) {
            tags.add("sanidad");
            if (allText.contains("publica") || allText.contains("pública")) {
                tags.add("sanidad-publica");
            }
        }
        if (allText.contains("historia") || allText.contains("histórico") || allText.contains("rey") ||
                allText.contains("23f") || allText.contains("desclasificacion")) {
            tags.add("historia");
            tags.add("politica");
        }
        if (allText.contains("tecnologia") || allText.contains("tecnología") || allText.contains("programacion") ||
                allText.contains("software") || allText.contains("aplicacion")) {
            tags.add("tecnologia");
        }
        if (allText.contains("sociedad") || allText.contains("noticia") || allText.contains("actualidad")) {
            tags.add("sociedad");
        }
        if (allText.contains("video") || allText.contains("youtube") || allText.contains("vimeo")) {
            tags.add("video");
        }
        if (allText.contains("articulo") || allText.contains("artículo") || allText.contains("noticia") ||
                allText.contains("cadena ser") || allText.contains("el país")) {
            tags.add("articulo");
        }

        // Extraer palabras clave del título
        if (title != null && !title.isEmpty()) {
            String[] titleWords = title.toLowerCase().split("[\\s|]+");
            for (String word : titleWords) {
                word = word.replaceAll("[^a-záéíóúñ]", "");
                if (word.length() > 4 && !tags.contains(word) && tags.size() < 6) {
                    // Evitar palabras muy comunes
                    if (!word.equals("sobre") && !word.equals("cuando") && !word.equals("desde") &&
                            !word.equals("hasta") && !word.equals("después") && !word.equals("nota")) {
                        tags.add(word);
                    }
                }
            }
        }

        // Si aún no hay tags, usar una genérica pero específica
        if (tags.isEmpty()) {
            tags.add("contenido");
        }

        return tags;
    }

    /**
     * Construye contenido detallado cuando la IA no lo proporciona
     */
    private String buildDetailedContentFromSummary(String title, String summary, String originalContent) {
        StringBuilder content = new StringBuilder();
        content.append("# ").append(title).append("\n\n");

        if (!summary.isEmpty()) {
            content.append("## Resumen\n\n").append(summary).append("\n\n");
        }

        content.append("## Contenido original\n\n");
        String preview = originalContent.substring(0, Math.min(originalContent.length(), 2000));
        content.append(preview);
        if (originalContent.length() > 2000) {
            content.append("\n\n... (contenido truncado)");
        }

        return content.toString();
    }

    /**
     * Extrae JSON de la respuesta (puede venir con texto adicional)
     */
    private String extractJSON(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "{}";
        }

        // Buscar el primer { y el último }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');

        if (start != -1 && end != -1 && end > start) {
            String json = text.substring(start, end + 1);
            logger.debug("JSON extraído: {}", json.substring(0, Math.min(json.length(), 300)));
            return json;
        }

        // Si no hay JSON, intentar buscar entre ```json o ```
        int jsonStart = text.indexOf("```json");
        if (jsonStart != -1) {
            jsonStart += 7; // Longitud de "```json"
            int jsonEnd = text.indexOf("```", jsonStart);
            if (jsonEnd != -1) {
                return text.substring(jsonStart, jsonEnd).trim();
            }
        }

        // Buscar entre ```
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

        logger.warn("No se pudo extraer JSON válido de la respuesta");
        return text;
    }

    /**
     * Crea un resultado por defecto cuando no se puede usar LLaMA
     */
    private ClassificationResult createDefaultResult() {
        return new ClassificationResult("nota", "Nota", "",
                "# Nota\n\n## Contenido\n\nContenido sin procesar.",
                "apunte", new String[] { "general" });
    }

    /**
     * Crea un resultado inteligente basado en el contenido cuando la IA falla
     */
    private ClassificationResult createSmartDefaultResult(String content) {
        // Extraer título del contenido
        String title = extractTitleFromContent(content);
        String summary = extractSummaryFromContent(content);
        List<String> tags = generateTagsFromContent(content, title, summary);

        // Construir contenido detallado
        String detailedContent = buildDetailedContentFromSummary(title, summary, content);

        // Detectar tipo
        String type = detectTypeFromContent(content);

        return new ClassificationResult(
                type,
                title,
                summary,
                detailedContent,
                "apunte",
                tags.toArray(new String[0]));
    }

    /**
     * Extrae un título del contenido
     */
    private String extractTitleFromContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return "Nota";
        }

        // Si hay "Título:" al inicio, extraerlo
        if (content.contains("Título:")) {
            int titleStart = content.indexOf("Título:") + 7;
            int titleEnd = content.indexOf("\n", titleStart);
            if (titleEnd == -1)
                titleEnd = Math.min(titleStart + 120, content.length());
            String title = content.substring(titleStart, titleEnd).trim();
            if (!title.isEmpty() && title.length() <= 120) {
                return title;
            }
        }

        // Si es una URL, usar parte de la URL como título
        if (content.startsWith("http://") || content.startsWith("https://")) {
            try {
                String domain = content.split("/")[2];
                return "Enlace: " + domain;
            } catch (Exception e) {
                return "Enlace";
            }
        }

        // Usar las primeras palabras del contenido
        String[] lines = content.split("\n");
        for (String line : lines) {
            line = line.trim();
            if (line.length() > 10 && line.length() <= 120) {
                return line;
            }
        }

        // Último recurso: primeras 120 caracteres
        String firstLine = content.trim().split("\n")[0];
        if (firstLine.length() > 120) {
            return firstLine.substring(0, 117) + "...";
        }
        return firstLine.isEmpty() ? "Nota" : firstLine;
    }

    /**
     * Extrae un resumen del contenido
     */
    private String extractSummaryFromContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return "";
        }

        // Si hay "Descripción:" o "Resumen:", extraerlo
        String[] keywords = { "Descripción:", "Resumen:", "Summary:" };
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

        // Usar las primeras líneas como resumen
        String[] lines = content.split("\n");
        StringBuilder summary = new StringBuilder();
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("Título:") || line.startsWith("URL:")) {
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
            // Si es muy corto, usar más contenido
            result = content.substring(0, Math.min(500, content.length())).trim();
            if (result.length() > 500) {
                result = result.substring(0, 497) + "...";
            }
        }

        return result;
    }

    /**
     * Detecta el tipo de contenido
     */
    private String detectTypeFromContent(String content) {
        if (content == null)
            return "nota";

        String lower = content.toLowerCase();
        if (lower.contains("video") || lower.contains("youtube") || lower.contains("vimeo")) {
            return "video";
        }
        if (content.startsWith("http://") || content.startsWith("https://") || content.startsWith("www.")) {
            return "link";
        }
        if (lower.contains("```") || lower.contains("function") || lower.contains("class ")) {
            return "codigo";
        }
        if (lower.contains("tutorial") || lower.contains("guía") || lower.contains("paso a paso")) {
            return "tutorial";
        }
        return "articulo";
    }

    /**
     * Clase para almacenar el resultado de la clasificación
     */
    /**
     * Verifica la veracidad de la información en el contenido.
     * Identifica afirmaciones falsas o dudosas y proporciona correcciones.
     */
    public List<FactCheckResponseDto.ClaimVerification> verifyInformation(String content) {
        if (content == null || content.trim().isEmpty()) {
            return new ArrayList<>();
        }

        logger.info("Verificando información de contenido de longitud: {}", content.length());

        try {
            String prompt = buildFactCheckPrompt(content);
            String response = callLlamaApi(prompt);

            if (response == null || response.trim().isEmpty()) {
                return new ArrayList<>();
            }

            return parseFactCheckResponse(response);
        } catch (Exception e) {
            logger.error("Error al verificar información con LLaMA: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Genera insights de tendencias personalizados usando LLaMA, a partir de:
     * - Tópicos con conteos (reciente vs anterior)
     * - Una muestra de items reales (título/tags/extracto)
     *
     * Devuelve un JSON con etiquetas más específicas y frases de insights.
     */
    public TrendsInsightsResponseDto generateTrendsInsights(TrendsInsightsParamsDto params) {
        if (params == null) {
            return new TrendsInsightsResponseDto();
        }

        // Si no hay API key configurada, devolver vacío (el frontend usará fallback determinista)
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("your-groq-api-key-here")) {
            logger.warn("API key de LLaMA no configurada, devolviendo insights vacíos");
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
            logger.error("Error generando insights de tendencias con LLaMA: {}", e.getMessage(), e);
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

        return "Actúa como un analista de tendencias personales. Te doy un RADAR de tópicos (conteos reciente vs anterior) y una muestra de items reales (título/tags/extracto).\n\n"
                + "OBJETIVO:\n"
                + "1) Etiquetar cada topic con un nombre más específico en español (sin inventar).\n"
                + "   - Si detectas música, concreta género/subgénero (ej. rap, techno, flamenco, reggaeton).\n"
                + "   - Si detectas política, concreta el ámbito (nacional/internacional/elecciones/partidos/políticas públicas).\n"
                + "   - Si no hay evidencia suficiente, usa etiqueta general (ej. 'música', 'política').\n"
                + "2) Generar 'insights' (1-3 frases) y 'recommendations' (1-3) basadas en los datos.\n\n"
                + "DATOS (JSON):\n" + data + "\n\n"
                + "REGLAS:\n"
                + "- No inventes hechos ni nombres propios; si dudas, sé conservador.\n"
                + "- Devuelve SOLO JSON válido, sin texto adicional ni markdown.\n\n"
                + "FORMATO DE SALIDA:\n"
                + "{\n"
                + "  \"topicLabels\": {\"topicOriginal\": \"Etiqueta específica\"},\n"
                + "  \"insights\": [\"...\"],\n"
                + "  \"recommendations\": [\"...\"]\n"
                + "}";
    }

    private String buildFactCheckPrompt(String content) {
        return "Actúa como un experto en verificación de hechos (fact-checking). Analiza el siguiente contenido y extrae las afirmaciones más importantes que puedan ser verificadas objetivamente.\n\n"
                +
                "CONTENIDO:\n" + content + "\n\n" +
                "REGLAS:\n" +
                "1. Divide el texto en afirmaciones individuales.\n" +
                "2. Evalúa cada afirmación como 'true' (verdadera), 'false' (falsa) o 'suspicious' (dudosa/sin consenso claro).\n"
                +
                "3. Para cada 'false' o 'suspicious', proporciona una explicación detallada de por qué y una versión corregida de la información.\n"
                +
                "4. Si la afirmación es 'true', la explicación puede ser breve y no requiere corrección.\n\n" +
                "Responde EXCLUSIVAMENTE con un JSON con este formato:\n" +
                "{\n" +
                "  \"claims\": [\n" +
                "    {\n" +
                "      \"originalText\": \"texto de la afirmación\",\n" +
                "      \"status\": \"true|false|suspicious\",\n" +
                "      \"explanation\": \"explicación detallada\",\n" +
                "      \"correction\": \"versión corregida\"\n" +
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
            logger.error("Error al parsear respuesta de fact-checking", e);
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
