package synapse.rest.dtos;

/**
 * Sugerencias generadas por el "cerebro" (IA/reglas) a partir de una entrada
 * del inbox.
 */
public class BrainSuggestionDto {

    private String type;       // link, nota, tarea, codigo, video...
    private String title;      // título sugerido
    private String summary;    // resumen o versión destilada
    private String destination; // apunte, idea, recurso, tarea...
    private String[] tags;     // etiquetas sugeridas

    public BrainSuggestionDto() {
    }

    public BrainSuggestionDto(String type, String title, String summary, String destination, String[] tags) {
        this.type = type;
        this.title = title;
        this.summary = summary;
        this.destination = destination;
        this.tags = tags;
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
}
