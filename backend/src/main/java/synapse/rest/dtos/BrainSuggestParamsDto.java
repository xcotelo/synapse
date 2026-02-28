package synapse.rest.dtos;

/**
 * Contenido bruto que el usuario ha capturado en el inbox y que queremos que
 * el "cerebro" analice.
 */
public class BrainSuggestParamsDto {

    private String content;

    public BrainSuggestParamsDto() {
    }

    public BrainSuggestParamsDto(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
