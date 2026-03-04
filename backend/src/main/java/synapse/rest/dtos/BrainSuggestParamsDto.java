package synapse.rest.dtos;

import jakarta.validation.constraints.NotBlank;

/**
 * Content captured in the inbox to be analyzed by the brain.
 */
public class BrainSuggestParamsDto {

    @NotBlank
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
