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
        return "Analiza el siguiente contenido y proporciona una clasificación estructurada en formato JSON. " +
               "El contenido puede ser texto, un enlace a una página web, un video, código, una tarea, etc.\n\n" +
               "Contenido:\n" + content.substring(0, Math.min(content.length(), 10000)) + "\n\n" +
               "Responde SOLO con un JSON válido que contenga los siguientes campos:\n" +
               "{\n" +
               "  \"type\": \"tipo detectado (link, video, nota, tarea, codigo, articulo, recurso, etc.)\",\n" +
               "  \"title\": \"título sugerido (máximo 100 caracteres)\",\n" +
               "  \"summary\": \"resumen del contenido (máximo 300 caracteres)\",\n" +
               "  \"destination\": \"destino sugerido (apunte, idea, recurso, tarea)\",\n" +
               "  \"tags\": [\"etiqueta1\", \"etiqueta2\", \"etiqueta3\"]\n" +
               "}\n\n" +
               "Sé preciso y conciso. El título debe ser descriptivo y el resumen debe capturar los puntos clave.";
    }

    /**
     * Llama a la API de Claude
     */
    private String callClaudeAPI(String prompt) throws IOException {
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("model", model);
        requestBody.addProperty("max_tokens", 1000);
        
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
            
            return new ClassificationResult(type, title, summary, destination, tags.toArray(new String[0]));
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
        return new ClassificationResult("nota", "Nota", "", "apunte", new String[]{"general"});
    }

    /**
     * Clase para almacenar el resultado de la clasificación
     */
    public static class ClassificationResult {
        private String type;
        private String title;
        private String summary;
        private String destination;
        private String[] tags;

        public ClassificationResult(String type, String title, String summary, String destination, String[] tags) {
            this.type = type;
            this.title = title;
            this.summary = summary;
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
    }
}
