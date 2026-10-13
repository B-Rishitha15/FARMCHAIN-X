
package com.infosys.farmtofork.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "crop_type")
    private String cropType;

    @Column(name = "quantity_kg")
    private Double quantityKg;

    @Column(name = "quality_grade")
    private String qualityGrade;

    @Column(name = "harvest_date")
    private LocalDate harvestDate;

    @Column(name = "location")
    private String location;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    // Legacy fields retained for compatibility
    @Column(name = "category")
    private String category;

    @Column(name = "description")
    private String description;

    // Farmer's base price
    @Column(name = "price")
    private Double price;

    // Distributor's selling price
    @Column(name = "distributor_price")
    private Double distributorPrice;

    // Retailer's final selling price
    @Column(name = "retailer_price")
    private Double retailerPrice;

    @Column(name = "unit")
    private String unit;

    @Column(name = "ai_score")
    private Double aiScore;

    @Column(name = "ai_verdict")
    private String aiVerdict;

    public enum Status {
        APPROVED,
        IN_TRANSIT,
        PENDING,
        REJECTED
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private Status status = Status.PENDING;
}
