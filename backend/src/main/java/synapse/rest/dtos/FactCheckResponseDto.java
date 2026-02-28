package synapse.rest.dtos;

import java.util.List;

public class FactCheckResponseDto {
    private List<ClaimVerification> claims;

    public FactCheckResponseDto() {
    }

    public FactCheckResponseDto(List<ClaimVerification> claims) {
        this.claims = claims;
    }

    public List<ClaimVerification> getClaims() {
        return claims;
    }

    public void setClaims(List<ClaimVerification> claims) {
        this.claims = claims;
    }

    public static class ClaimVerification {
        private String originalText;
        private String status; // true, false, suspicious
        private String explanation;
        private String correction;

        public ClaimVerification() {
        }

        public ClaimVerification(String originalText, String status, String explanation, String correction) {
            this.originalText = originalText;
            this.status = status;
            this.explanation = explanation;
            this.correction = correction;
        }

        public String getOriginalText() {
            return originalText;
        }

        public void setOriginalText(String originalText) {
            this.originalText = originalText;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getExplanation() {
            return explanation;
        }

        public void setExplanation(String explanation) {
            this.explanation = explanation;
        }

        public String getCorrection() {
            return correction;
        }

        public void setCorrection(String correction) {
            this.correction = correction;
        }
    }
}
