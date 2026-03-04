package synapse.rest.dtos;

import jakarta.validation.constraints.NotBlank;

public class FactCheckParamsDto {

    @NotBlank
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
