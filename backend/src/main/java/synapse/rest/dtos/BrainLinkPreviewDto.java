package synapse.rest.dtos;

/**
 * Vista previa de una fuente externa (enlace/vídeo) extraída por el backend.
 *
 * Se usa para que el usuario pueda ver qué se ha podido recuperar de la URL
 * antes de convertirlo en conocimiento.
 */
public class BrainLinkPreviewDto {

    private String url;
    private String type;
    private String title;
    private String description;
    private String contentSnippet;

    public BrainLinkPreviewDto() {
    }

    public BrainLinkPreviewDto(String url, String type, String title, String description, String contentSnippet) {
        this.url = url;
        this.type = type;
        this.title = title;
        this.description = description;
        this.contentSnippet = contentSnippet;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getContentSnippet() {
        return contentSnippet;
    }

    public void setContentSnippet(String contentSnippet) {
        this.contentSnippet = contentSnippet;
    }
}
