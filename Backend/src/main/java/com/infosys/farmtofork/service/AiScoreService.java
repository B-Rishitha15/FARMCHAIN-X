package com.infosys.farmtofork.service;

import com.infosys.farmtofork.dto.AiScoreResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@Service
public class AiScoreService {

    private static final Logger log = LoggerFactory.getLogger(AiScoreService.class);

    private final RestTemplate restTemplate;
    private final String serviceUrl;
    private final boolean enabled;

    public AiScoreService(RestTemplateBuilder restTemplateBuilder,
                          @Value("${ai.score.service-url:http://localhost:5001/score}") String serviceUrl,
                          @Value("${ai.score.enabled:true}") boolean enabled) {
        this.restTemplate = restTemplateBuilder
            .setConnectTimeout(Duration.ofSeconds(5))
            .setReadTimeout(Duration.ofSeconds(15))
            .build();
        this.serviceUrl = serviceUrl;
        this.enabled = enabled;
    }

    public Optional<AiScoreResult> scoreImage(String imageDataUrl) {
        if (!enabled || imageDataUrl == null || imageDataUrl.isBlank()) {
            return Optional.empty();
        }

        try {
            AiScoreResult response = restTemplate.postForObject(
                serviceUrl,
                Map.of("image", imageDataUrl),
                AiScoreResult.class
            );
            return Optional.ofNullable(response);
        } catch (Exception ex) {
            log.warn("Failed to fetch AI score: {}", ex.getMessage());
            return Optional.empty();
        }
    }
}




