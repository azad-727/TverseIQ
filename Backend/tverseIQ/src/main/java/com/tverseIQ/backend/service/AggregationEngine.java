package com.tverseIQ.backend.service;

import com.tverseIQ.backend.dto.ParsedRowDto;
import com.tverseIQ.backend.model.ProductKeywordStats;
import com.tverseIQ.backend.repository.ProductKeywordStatsJdbcRepository;
import com.tverseIQ.backend.repository.ProductKeywordStatsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class AggregationEngine {

    private final ProductKeywordStatsJdbcRepository statsJdbcRepository;

    public AggregationEngine(ProductKeywordStatsJdbcRepository statsJdbcRepository) {
        this.statsJdbcRepository = statsJdbcRepository;
    }

    public void processAndAggregateBatch(List<ParsedRowDto> batch, int mappedProductCount, boolean hasAsin, LocalDate periodEnd) {
        if (batch.isEmpty()) return;

        BigDecimal confidenceScore;
        String attributionType;

        if (mappedProductCount == 1 || hasAsin) {
            confidenceScore = BigDecimal.ONE;
            attributionType = "CONFIRMED";
        } else {
            confidenceScore = BigDecimal.ONE.divide(BigDecimal.valueOf(mappedProductCount), 2, RoundingMode.HALF_UP);
            attributionType = "SHARED";
        }

        // Group keywords and sum metrics in memory!
        java.util.Map<String, ProductKeywordStats> groupedStats = new java.util.HashMap<>();

        for (ParsedRowDto row : batch) {
            // Create a unique key for grouping
            String uniqueKey = row.productId() + "_" + row.keyword() + "_" + row.matchType();

            int attributedImpressions = Math.round((row.impressions() != null ? row.impressions() : 0) * confidenceScore.floatValue());
            int attributedClicks = Math.round((row.clicks() != null ? row.clicks() : 0) * confidenceScore.floatValue());
            int attributedOrders = Math.round((row.orders() != null ? row.orders() : 0) * confidenceScore.floatValue());
            BigDecimal attributedSpend = (row.spend() != null ? row.spend() : BigDecimal.ZERO).multiply(confidenceScore).setScale(2, RoundingMode.HALF_UP);
            BigDecimal attributedSales = (row.sales() != null ? row.sales() : BigDecimal.ZERO).multiply(confidenceScore).setScale(2, RoundingMode.HALF_UP);

            ProductKeywordStats existing = groupedStats.get(uniqueKey);

            if (existing == null) {
                ProductKeywordStats stat = new ProductKeywordStats();
                stat.setProductId(row.productId());
                stat.setKeyword(row.keyword());
                stat.setMatchType(row.matchType());

                stat.setCumulativeImpressions(attributedImpressions);
                stat.setCumulativeClicks(attributedClicks);
                stat.setCumulativeOrders(attributedOrders);
                stat.setCumulativeSpend(attributedSpend);
                stat.setCumulativeSales(attributedSales);

                stat.setAttributionType(attributionType);
                stat.setConfidenceScore(confidenceScore);
                stat.setTimesAppeared(1);

                if (attributedOrders > 0) {
                    stat.setFirstConvertedDate(periodEnd);
                    stat.setLastConvertedDate(periodEnd);
                }
                groupedStats.put(uniqueKey, stat);
            } else {
                // If we already have this keyword in the batch, SUM the data instead of overwriting!
                existing.setCumulativeImpressions(existing.getCumulativeImpressions() + attributedImpressions);
                existing.setCumulativeClicks(existing.getCumulativeClicks() + attributedClicks);
                existing.setCumulativeOrders(existing.getCumulativeOrders() + attributedOrders);
                existing.setCumulativeSpend(existing.getCumulativeSpend().add(attributedSpend));
                existing.setCumulativeSales(existing.getCumulativeSales().add(attributedSales));
                existing.setTimesAppeared(existing.getTimesAppeared() + 1);

                if (attributedOrders > 0) {
                    existing.setLastConvertedDate(periodEnd); // update latest conversion date
                }
            }
        }

        // Send the neatly aggregated list to the database
        List<ProductKeywordStats> aggregatedList = new ArrayList<>(groupedStats.values());
        statsJdbcRepository.batchDeltaUpsert(aggregatedList);
        log.info("Successfully flushed {} aggregated keyword deltas to product_keyword_stats.", aggregatedList.size());
        clearDashboardCache();
    }

    @CacheEvict(value = "globalMetrics", allEntries = true)
    public void clearDashboardCache() {
        log.info("Redis cache 'globalMetrics' evicted due to new data ingestion.");
    }
}