package com.infosys.farmtofork.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiScoreResult {

    @JsonProperty("ai_score")
    private Double aiScore;

    @JsonProperty("predicted_class")
    private String predictedClass;

    @JsonProperty("quality_label")
    private String qualityLabel;

    private Double confidence;

    @JsonProperty("fresh_percentage")
    private Double freshPercentage;

    @JsonProperty("rotten_percentage")
    private Double rottenPercentage;
}




