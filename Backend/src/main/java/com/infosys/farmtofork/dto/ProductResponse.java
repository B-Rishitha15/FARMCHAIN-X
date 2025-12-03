package com.infosys.farmtofork.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {
    private Long id;
    private String name;
    // keep category for frontend compatibility (mapped from cropType)
    private String category;
    private String cropType;
    private Double quantityKg;
    private String qualityGrade;
    private String harvestDate; // yyyy-MM-dd
    private String location;
    private String status;
    private String imageUrl;
    private Double aiScore;
    private String aiVerdict;
    // Base price from product entity (typically farmer price per unit)
    private Double price;
}
