package com.tverseIQ.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long campaignId;

    @Column(nullable=false, unique=true)
    private String campaignName;

    @Column(length=100)
    private String themeTag;

    // --- NEW SRS FIELDS --- //

    @Column(nullable = false)
    private String platform; // "AMAZON" or "FLIPKART"

    @Column(precision = 10, scale = 2)
    private BigDecimal budget;

    @Column(name = "budget_type")
    private String budgetType; // "DAILY" or "TOTAL"

    @Column(name = "targeting_type")
    private String targetingType; // "AUTO" or "MANUAL"

    @Column(name = "targeting_sub_type")
    private String targetingSubType; // "KEYWORD" or "PRODUCT"

    @Column(name = "match_types")
    private String matchTypes;

    @ManyToMany(fetch = FetchType.EAGER) // Added EAGER to ensure the async parser can read it
    @JoinTable(
            name = "campaign_product_map", // <-- FIXED TABLE NAME!
            joinColumns = @JoinColumn(name = "campaign_id"),
            inverseJoinColumns = @JoinColumn(name = "product_id")
    )
    private List<Product> mappedProducts = new ArrayList<>();
}