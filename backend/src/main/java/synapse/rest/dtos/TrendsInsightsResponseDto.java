package synapse.rest.dtos;

import java.util.List;
import java.util.Map;

public class TrendsInsightsResponseDto {
    private Map<String, String> topicLabels;
    private List<String> insights;
    private List<String> recommendations;

    public TrendsInsightsResponseDto() {
    }

    public TrendsInsightsResponseDto(Map<String, String> topicLabels, List<String> insights, List<String> recommendations) {
        this.topicLabels = topicLabels;
        this.insights = insights;
        this.recommendations = recommendations;
    }

    public Map<String, String> getTopicLabels() {
        return topicLabels;
    }

    public void setTopicLabels(Map<String, String> topicLabels) {
        this.topicLabels = topicLabels;
    }

    public List<String> getInsights() {
        return insights;
    }

    public void setInsights(List<String> insights) {
        this.insights = insights;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }
}
