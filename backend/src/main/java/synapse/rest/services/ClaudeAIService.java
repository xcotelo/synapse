package synapse.rest.services;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

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
 * Servicio para interactuar con la API de Claude AI
 */
@Service
public class ClaudeAIService {

    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private final OkHttpClient client;
    private final Gson gson;
    
    @Value("${project.claude.apiKey}")
    private String apiKey;
    
    @Value("${project.claude.apiUrl}")
    private String apiUrl;
    
    @Value("${project.claude.model}")
    private String model;

    public ClaudeAIService() {
        this.client = new OkHttpClient();
        this.gson = new Gson();
    }

    /**
     * Clasifica y analiza contenido usando Claude AI
     * 
     * @param content El contenido a analizar
     * @return Resultado de la clasificación con sugerencias
     */
    public ClassificationResult classifyContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            return createDefaultResult();
        }

        // Si no hay API key configurada, usar reglas básicas
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("your-api-key-here")) {
            return createDefaultResult();
        }

        try {
            String prompt = buildClassificationPrompt(content);
            String response = callClaudeAPI(prompt);
            return parseClaudeResponse(response, content);
        } catch (Exception e) {
            // Si falla, devolver resultado por defecto
            return createDefaultResult();
        }
    }

    /**
     * Construye el prompt para Claude
     */
    private String buildClassificationPrompt(String content) {
        // Detectar si es un video basándose en el contenido
        boolean isVideo = content.contains("VIDEO") || content.contains("VIDEO DE YOUTUBE") || 
                         content.contains("CANAL:") || content.contains("TÍTULO DEL VIDEO:");
        
        String videoInstructions = "";
        if (isVideo) {
            videoInstructions = "\n\nINSTRUCCIONES ESPECIALES PARA VIDEOS:\n" +
                               "- Analiza el TÍTULO DEL VIDEO para identificar el tema principal y subtemas.\n" +
                               "- Lee la DESCRIPCIÓN DEL VIDEO completa: contiene información valiosa sobre el contenido, " +
                               "temas tratados, conceptos explicados, tecnologías mencionadas, etc.\n" +
                               "- Considera el CANAL: puede indicar el contexto y especialización del contenido.\n" +
                               "- Extrae del título y descripción: tecnologías específicas, frameworks, lenguajes de programación, " +
                               "conceptos técnicos, metodologías, herramientas mencionadas, temas educativos, etc.\n" +
                               "- El RESUMEN debe explicar QUÉ enseña o trata el video, QUÉ conceptos cubre, QUÉ tecnologías usa, " +
                               "QUÉ problemas resuelve. NO digas solo 'es un video sobre X', explica el CONTENIDO REAL.\n" +
                               "- Las ETIQUETAS deben reflejar el contenido REAL: si es sobre React hooks, usa 'react-hooks', " +
                               "si es sobre algoritmos de grafos, usa 'algoritmos-grafos', si es sobre filosofía estoica, " +
                               "usa 'filosofia-estoica'. Analiza el título y descripción para extraer temas específicos.\n" +
                               "- El TÍTULO debe ser descriptivo del contenido real, no solo repetir el título del video.\n";
        }
        
        return "Eres un experto analista de contenido. Tu tarea es analizar CRÍTICAMENTE el siguiente contenido " +
               "y proporcionar un análisis estructurado y detallado.\n\n" +
               "CONTENIDO A ANALIZAR:\n" + 
               content.substring(0, Math.min(content.length(), 20000)) + "\n\n" +
               "INSTRUCCIONES CRÍTICAS:\n" +
               "1. LEE Y COMPRENDE TODO el contenido antes de clasificar. Analiza título, descripción, canal (si aplica), " +
               "y cualquier información disponible. NO uses etiquetas genéricas como 'general', 'varios', 'otros', 'youtube'.\n" +
               "2. El RESUMEN debe ser ELABORADO y ESPECÍFICO: explica QUÉ enseña, QUÉ conceptos cubre, QUÉ tecnologías menciona, " +
               "QUÉ problemas resuelve, QUÉ metodologías presenta. Debe ser informativo para alguien que no haya visto el contenido. " +
               "Mínimo 200 caracteres, máximo 800 caracteres. Para videos, explica el contenido educativo o informativo del video.\n" +
               "3. Las ETIQUETAS deben ser ESPECÍFICAS y PRECISAS. Analiza el tema principal, subtemas, tecnologías, " +
               "frameworks, lenguajes, conceptos clave, disciplinas mencionadas. Usa 4-6 etiquetas específicas. " +
               "Ejemplos buenos: 'react-hooks', 'machine-learning-supervised', 'algoritmos-dijkstra', 'filosofia-estoica', " +
               "'python-pandas', 'docker-containers'. Ejemplos malos: 'general', 'varios', 'tecnologia', 'programacion', 'video'.\n" +
               "4. El TIPO debe ser preciso: 'video' (solo para videos), 'articulo' (artículo de blog/noticia), " +
               "'tutorial' (guía paso a paso escrita), 'codigo' (snippet/repositorio), 'documentacion' (referencia técnica), " +
               "'investigacion' (paper/estudio), 'nota' (solo si es texto breve sin estructura clara).\n" +
               "5. El DESTINO debe reflejar el propósito real: 'apunte' (contenido educativo/estudio), 'idea' (concepto/reflexión), " +
               "'recurso' (herramienta/referencia), 'tarea' (acción pendiente).\n" +
               videoInstructions +
               "\nResponde ÚNICAMENTE con un JSON válido (sin texto adicional, sin markdown, sin explicaciones):\n" +
               "{\n" +
               "  \"type\": \"tipo-preciso-del-contenido\",\n" +
               "  \"title\": \"Título descriptivo y específico que refleje el contenido real (máximo 120 caracteres)\",\n" +
               "  \"summary\": \"Resumen elaborado y detallado explicando QUÉ enseña/cubre el contenido, QUÉ conceptos, " +
               "tecnologías o metodologías presenta (200-800 caracteres)\",\n" +
               "  \"detailedContent\": \"Contenido detallado en formato Markdown. Debe ser ESPECÍFICO y ESTRUCTURADO. " +
               "Incluye: título principal, resumen ejecutivo, puntos clave organizados por secciones, conceptos importantes, " +
               "tecnologías/frameworks mencionados, conclusiones o takeaways. Usa encabezados (##), listas (-), código (```) si aplica, " +
               "y formato markdown apropiado. Mínimo 500 caracteres. Sé detallado y específico sobre el contenido real.\",\n" +
               "  \"destination\": \"apunte|idea|recurso|tarea\",\n" +
               "  \"tags\": [\"etiqueta-especifica-1\", \"etiqueta-especifica-2\", \"etiqueta-especifica-3\", \"etiqueta-especifica-4\"]\n" +
               "}\n\n" +
               "IMPORTANTE: \n" +
               "- Sé crítico y preciso. Analiza el contenido REAL, no solo la estructura.\n" +
               "- El detailedContent debe ser un documento markdown completo y bien estructurado que capture la esencia del contenido.\n" +
               "- Para videos: explica qué enseña, qué conceptos cubre, qué tecnologías demuestra, qué problemas resuelve.\n" +
               "- Para artículos: extrae los puntos principales, argumentos clave, conclusiones, metodologías.\n" +
               "- Extrae información específica del título y descripción. Evita generalizaciones.";
    }

    /**
     * Llama a la API de Claude
     */
    private String callClaudeAPI(String prompt) throws IOException {
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("model", model);
        requestBody.addProperty("max_tokens", 4000);
        
        JsonArray messages = new JsonArray();
        JsonObject message = new JsonObject();
        message.addProperty("role", "user");
        message.addProperty("content", prompt);
        messages.add(message);
        
        requestBody.add("messages", messages);

        RequestBody body = RequestBody.create(requestBody.toString(), JSON);
        Request request = new Request.Builder()
                .url(apiUrl)
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .header("Content-Type", "application/json")
                .post(body)
                .build();

        try (Response response = client.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("Unexpected code: " + response);
            }
            
            String responseBody = response.body().string();
            JsonObject jsonResponse = gson.fromJson(responseBody, JsonObject.class);
            
            // Extraer el contenido de la respuesta
            JsonArray contentArray = jsonResponse.getAsJsonArray("content");
            if (contentArray != null && contentArray.size() > 0) {
                JsonObject contentObj = contentArray.get(0).getAsJsonObject();
                return contentObj.get("text").getAsString();
            }
            
            return "";
        }
    }

    /**
     * Parsea la respuesta de Claude
     */
    private ClassificationResult parseClaudeResponse(String response, String originalContent) {
        try {
            // Intentar extraer JSON de la respuesta
            String jsonStr = extractJSON(response);
            JsonObject json = gson.fromJson(jsonStr, JsonObject.class);
            
            String type = json.has("type") ? json.get("type").getAsString() : "nota";
            String title = json.has("title") ? json.get("title").getAsString() : "Nota";
            String summary = json.has("summary") ? json.get("summary").getAsString() : "";
            String detailedContent = json.has("detailedContent") ? json.get("detailedContent").getAsString() : "";
            String destination = json.has("destination") ? json.get("destination").getAsString() : "apunte";
            
            List<String> tags = new ArrayList<>();
            if (json.has("tags") && json.get("tags").isJsonArray()) {
                JsonArray tagsArray = json.getAsJsonArray("tags");
                for (int i = 0; i < tagsArray.size(); i++) {
                    tags.add(tagsArray.get(i).getAsString());
                }
            }
            
            if (tags.isEmpty()) {
                tags.add("general");
            }
            
            // Si no hay detailedContent, crear uno básico a partir del summary
            if (detailedContent.isEmpty() && !summary.isEmpty()) {
                detailedContent = "# " + title + "\n\n## Resumen\n\n" + summary + "\n\n## Contenido original\n\n" + originalContent.substring(0, Math.min(originalContent.length(), 1000));
            }
            
            return new ClassificationResult(type, title, summary, detailedContent, destination, tags.toArray(new String[0]));
        } catch (Exception e) {
            // Si falla el parsing, devolver resultado por defecto
            return createDefaultResult();
        }
    }

    /**
     * Extrae JSON de la respuesta (puede venir con texto adicional)
     */
    private String extractJSON(String text) {
        // Buscar el primer { y el último }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        
        if (start != -1 && end != -1 && end > start) {
            return text.substring(start, end + 1);
        }
        
        return text;
    }

    /**
     * Crea un resultado por defecto cuando no se puede usar Claude
     */
    private ClassificationResult createDefaultResult() {
        return new ClassificationResult("nota", "Nota", "", "# Nota\n\n## Contenido\n\nContenido sin procesar.", "apunte", new String[]{"general"});
    }

    /**
     * Clase para almacenar el resultado de la clasificación
     */
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

        public ClassificationResult(String type, String title, String summary, String detailedContent, String destination, String[] tags) {
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
