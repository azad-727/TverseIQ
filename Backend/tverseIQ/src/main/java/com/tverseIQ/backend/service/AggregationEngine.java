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

        // FR-3: 3-Case Attribution Math
        BigDecimal confidenceScore;
        String attributionType;

        if (mappedProductCount == 1 || hasAsin) {
            confidenceScore = BigDecimal.ONE;
            attributionType = "CONFIRMED";
        } else {
            confidenceScore = BigDecimal.ONE.divide(BigDecimal.valueOf(mappedProductCount), 2, RoundingMode.HALF_UP);
            attributionType = "SHARED";
        }

        List<ProductKeywordStats> aggregatedList = new ArrayList<>(batch.size());

        for (ParsedRowDto row : batch) {
            ProductKeywordStats stat = new ProductKeywordStats();
            stat.setProductId(row.productId());
            stat.setKeyword(row.keyword());

            BigDecimal attributedSpend = row.spend().multiply(confidenceScore).setScale(2, RoundingMode.HALF_UP);
            BigDecimal attributedSales = row.sales().multiply(confidenceScore).setScale(2, RoundingMode.HALF_UP);
            int attributedOrders = Math.round(row.orders() * confidenceScore.floatValue());

            stat.setCumulativeSpend(attributedSpend);
            stat.setCumulativeSales(attributedSales);
            stat.setCumulativeOrders(attributedOrders);
            stat.setAttributionType(attributionType);
            stat.setConfidenceScore(confidenceScore);
            stat.setTimesAppeared(1);

            if (attributedOrders > 0) {
                stat.setFirstConvertedData(periodEnd);
                stat.setLastConvertedDate(periodEnd);
            }

            aggregatedList.add(stat);
        }

        statsJdbcRepository.batchDeltaUpsert(aggregatedList);
        log.info("Successfully flushed {} aggregated keyword deltas to product_keyword_stats.", aggregatedList.size());
    }
    @CacheEvict(value = "globalMetrics", allEntries = true)
    public void clearDashboardCache() {
        log.info("Redis cache 'globalMetrics' evicted due to new data ingestion.");
    }
}