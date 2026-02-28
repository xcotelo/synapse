package synapse.rest.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import synapse.rest.dtos.BrainSuggestParamsDto;
import synapse.rest.dtos.BrainSuggestionDto;
import synapse.rest.services.ClaudeAIService;
import synapse.rest.services.ContentExtractionService;

/**
 * Endpoint que utiliza IA (LLaMA 3) para clasificar y analizar contenido.
 * Extrae contenido de URLs y utiliza LLaMA 3 para clasificación inteligente.
 */
@RestController
@RequestMapping("/api/brain")
public class BrainController {

    @Autowired
    private ContentExtractionService contentExtractionService;

    @Autowired
    private ClaudeAIService claudeAIService;

    @PostMapping("/suggest")
    @ResponseStatus(HttpStatus.OK)
    public BrainSuggestionDto suggest(@RequestBody BrainSuggestParamsDto params) {

        String inputContent = params.getContent() == null ? "" : params.getContent().trim();

        if (inputContent.isEmpty()) {
            return new BrainSuggestionDto("nota", "Nota", "", "apunte", new String[]{"general"});
        }

        // 1. Extraer contenido si es una URL
        String contentToAnalyze = inputContent;
        ContentExtractionService.ExtractedContent extracted = null;
        
        if (isUrl(inputContent)) {
            extracted = contentExtractionService.extractContent(inputContent);
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
        }

        // 2. Usar LLaMA 3 para clasificar
        ClaudeAIService.ClassificationResult classification = claudeAIService.classifyContent(contentToAnalyze);

        // 3. Si extrajimos contenido de una URL, usar el título extraído si LLaMA 3 no proporcionó uno mejor
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
            classification.getTags()
        );
    }

    /**
     * Verifica si el contenido es una URL
     */
    private boolean isUrl(String content) {
        if (content == null || content.trim().isEmpty()) {
            return false;
        }
        String trimmed = content.trim().toLowerCase();
        return trimmed.startsWith("http://") || trimmed.startsWith("https://");
    }

}
