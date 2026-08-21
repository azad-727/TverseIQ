package com.tverseIQ.backend.dto;

import java.math.BigDecimal;
import java.util.List;

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

    public record KeywordFilterRequest(

            // 1. One-Click Strategic Presets
            Boolean presetReadyToGraduate,
            Boolean presetBleeding,
            Boolean presetHighTrafficZeroCart,
            Boolean presetProfitableButStarved,

            // 2. Core Performance Sliders
            BigDecimal minSpend,
            BigDecimal maxSpend,
            BigDecimal minAcos,
            BigDecimal maxAcos,
            BigDecimal minCvr,
            BigDecimal maxCpc,
            Integer minOrders,

            // 3. Temporal & Consistency
            Integer minConsistencyDays,
            String lifecycleStage,

            // 4. Structural & Marketplace

            String marketplace,
            List<String> matchTypes,
            List<Long> campaignIds
    ) {}
}
