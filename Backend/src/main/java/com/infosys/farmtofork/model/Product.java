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
    private String name; // Product name

    @Column(name = "crop_type")
    private String cropType; // Crop Type

    @Column(name = "quantity_kg")
    private Double quantityKg; // Quantity in kg

    @Column(name = "quality_grade")
    private String qualityGrade; // Quality Grade

    @Column(name = "harvest_date")
    private LocalDate harvestDate; // Harvest Date

    @Column(name = "location")
    private String location; // Location

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl; // Base64 or external URL

    // Legacy fields retained for database compatibility
    @Column(name = "category")
    private String category;

    @Column(name = "description")
    private String description;

    @Column(name = "price")
    private Double price;

    @Column(name = "unit")
    private String unit; // kg, litre, piece

    @Column(name = "ai_score")
    private Double aiScore; // 0 - 100 AI freshness score

    @Column(name = "ai_verdict")
    private String aiVerdict; // e.g., Good Quality / Bad Quality

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
