package synapse.rest.dtos;

public class FactCheckParamsDto {
    private String content;

    public FactCheckParamsDto() {
    }

    public FactCheckParamsDto(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
