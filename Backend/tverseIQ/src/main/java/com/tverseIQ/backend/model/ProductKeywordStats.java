package com.tverseIQ.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name="product_keyword_stats", indexes = {
        @Index(name="idx_product_orders",columnList="product_id,cumulative_orders DESC"),
        @Index(name="idx_keyword_orders", columnList ="keyword,cumulative_orders DESC"),
        @Index(name="idx_confidence",columnList = "confidence_score , attribution_type")
})
@Getter
@Setter
@IdClass(ProductKeywordStats.class)
public class ProductKeywordStats {

    @Id
    @Column(name="product_id", nullable = false)
    private Long productId;

    @Id
    @Column(name="match_type",nullable = false,length=255)
    private String matchType;

    @Column(name = "cumulative_impressions", nullable = false)
    private Integer cumulativeImpressions = 0;

    @Column(name = "cumulative_clicks", nullable = false)
    private Integer cumulativeClicks = 0;

    @Column(name="keyword",nullable = false,length=255)
    private String keyword;


    @Column(name="cumulative_orders",nullable = false)
    private Integer cumulativeOrders=0;

    @Column(name="cumulative_spend",precision = 12,scale=2,nullable = false)
    private BigDecimal cumulativeSpend=BigDecimal.ZERO;

    @Column(name="cumulative_sales",precision = 12,scale=2,nullable = false)
    private BigDecimal cumulativeSales=BigDecimal.ZERO;

    @Column(name="cvr",precision = 5,scale=4,nullable = false)
    private BigDecimal cvr = BigDecimal.ZERO;

    @Column(name="attributionType",nullable = false,length = 20)
    private String attributionType;

    @Column(name="confidenceScore",nullable = false,precision = 3,scale = 2)
    private BigDecimal confidenceScore=BigDecimal.ONE;

    @Column(name="timesAppeared",nullable = false)
    private Integer timesAppeared =0;

    @Column(name = "consistency_index", precision = 5, scale = 2)
    private BigDecimal consistencyIndex = BigDecimal.ZERO;

    @Column(name = "search_intent_score", precision = 5, scale = 2)
    private BigDecimal searchIntentScore = BigDecimal.ZERO;

    @Column(name="firstConvertedData")
    private LocalDate firstConvertedData;

    @Column(name="lastConvertedData")
    private LocalDate lastConvertedDate;

}
