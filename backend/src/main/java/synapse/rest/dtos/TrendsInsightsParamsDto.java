package synapse.rest.dtos;

import java.util.List;

public class TrendsInsightsParamsDto {
    private int windowDays;
    private List<TopicCountDto> topics;
    private List<TrendSampleItemDto> items;

    public TrendsInsightsParamsDto() {
    }

    public int getWindowDays() {
        return windowDays;
    }

    public void setWindowDays(int windowDays) {
        this.windowDays = windowDays;
    }

    public List<TopicCountDto> getTopics() {
        return topics;
    }

    public void setTopics(List<TopicCountDto> topics) {
        this.topics = topics;
    }

    public List<TrendSampleItemDto> getItems() {
        return items;
    }

    public void setItems(List<TrendSampleItemDto> items) {
        this.items = items;
    }

    public static class TopicCountDto {
        private String topic;
        private String trend;
        private Integer recentCount;
        private Integer previousCount;

        public TopicCountDto() {
        }

        public String getTopic() {
            return topic;
        }

        public void setTopic(String topic) {
            this.topic = topic;
        }

        public String getTrend() {
            return trend;
        }

        public void setTrend(String trend) {
            this.trend = trend;
        }

        public Integer getRecentCount() {
            return recentCount;
        }

        public void setRecentCount(Integer recentCount) {
            this.recentCount = recentCount;
        }

        public Integer getPreviousCount() {
            return previousCount;
        }

        public void setPreviousCount(Integer previousCount) {
            this.previousCount = previousCount;
        }
    }

    public static class TrendSampleItemDto {
        private String createdAt;
        private String type;
        private String title;
        private List<String> tags;
        private String content;

        public TrendSampleItemDto() {
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
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

        public List<String> getTags() {
            return tags;
        }

        public void setTags(List<String> tags) {
            this.tags = tags;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }
    }
}
