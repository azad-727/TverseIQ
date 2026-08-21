package com.tverseIQ.backend.dto;

import java.math.BigDecimal;

public class DashboardDto {

    public record GlobalMetricsDto(
            BigDecimal totalSpend,
            BigDecimal totalSales,
            Integer totalOrders,
            BigDecimal roas,
            BigDecimal acos
    ) {}

    public record ProductOverviewDto(
            Long productId,
            String sku,
            String productName,
            BigDecimal totalSpend,
            BigDecimal totalSales,
            Integer totalOrders
    ) {}

    public record KeywordDeepDiveDto(
            String keyword,
            String matchType, // TARGETING
            Integer impressions,
            Integer clicks,
            Integer orders,
            BigDecimal spend,
            BigDecimal sales,
            BigDecimal avgCpc,          // CALCULATED
            BigDecimal avgCtr,          // CALCULATED
            BigDecimal costPerPurchase, // CALCULATED (CPA)
            BigDecimal purchaseRate,    // CALCULATED (CVR %)
            BigDecimal consistencyIndex,
            BigDecimal searchIntentScore,
            String attributionType,
            BigDecimal confidenceScore,
            boolean isReadyToGraduate,
            boolean isBleeding
    ){}
}
