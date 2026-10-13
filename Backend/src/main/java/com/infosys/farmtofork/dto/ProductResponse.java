
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

    // Keep category for frontend compatibility
    private String category;
    private String cropType;

    private Double quantityKg;
    private String qualityGrade;
    private String harvestDate;
    private String location;
    private String status;
    private String imageUrl;

    private Double aiScore;
    private String aiVerdict;

    // Farmer's base price
    private Double price;

    // Distributor's selling price
    private Double distributorPrice;

    // Retailer's final selling price
    private Double retailerPrice;
}
