package synapse.rest.dtos;

/**
 * Sugerencias generadas por el "cerebro" (IA/reglas) a partir de una entrada
 * del inbox.
 */
public class BrainSuggestionDto {

    private String type;       // link, nota, tarea, codigo, video...
    private String title;      // título sugerido
    private String summary;    // resumen o versión destilada
    private String detailedContent; // contenido detallado en markdown
    private String destination; // apunte, idea, recurso, tarea...
    private String[] tags;     // etiquetas sugeridas

    // Opcional: URL al recurso multimedia asociado (audio/vídeo) y su tipo MIME
    private String mediaUrl;
    private String mediaContentType;

    public BrainSuggestionDto() {
    }

    public BrainSuggestionDto(String type, String title, String summary, String destination, String[] tags) {
        this.type = type;
        this.title = title;
        this.summary = summary;
        this.destination = destination;
        this.tags = tags;
    }

    public BrainSuggestionDto(String type, String title, String summary, String detailedContent, String destination, String[] tags) {
        this.type = type;
        this.title = title;
        this.summary = summary;
        this.detailedContent = detailedContent;
        this.destination = destination;
        this.tags = tags;
    }

    public BrainSuggestionDto(String type, String title, String summary, String detailedContent, String destination,
            String[] tags, String mediaUrl, String mediaContentType) {
        this.type = type;
        this.title = title;
        this.summary = summary;
        this.detailedContent = detailedContent;
        this.destination = destination;
        this.tags = tags;
        this.mediaUrl = mediaUrl;
        this.mediaContentType = mediaContentType;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String[] getTags() {
        return tags;
    }

    public void setTags(String[] tags) {
        this.tags = tags;
    }

    public String getDetailedContent() {
        return detailedContent;
    }

    public void setDetailedContent(String detailedContent) {
        this.detailedContent = detailedContent;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public String getMediaContentType() {
        return mediaContentType;
    }

    public void setMediaContentType(String mediaContentType) {
        this.mediaContentType = mediaContentType;
    }
}
