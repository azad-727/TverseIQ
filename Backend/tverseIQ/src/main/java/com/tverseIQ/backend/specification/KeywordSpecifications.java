package com.tverseIQ.backend.specification;

import com.tverseIQ.backend.dto.DashboardDto.KeywordFilterRequest;
import com.tverseIQ.backend.model.ProductKeywordStats;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class KeywordSpecifications {

    public static Specification<ProductKeywordStats> withDynamicFilters(KeywordFilterRequest request) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. ONE-CLICK STRATEGIC PRESETS
            if (Boolean.TRUE.equals(request.presetBleeding())) {
                predicates.add(criteriaBuilder.greaterThan(root.get("cumulativeSpend"), new BigDecimal("500")));
                predicates.add(criteriaBuilder.equal(root.get("cumulativeOrders"), 0));
            }

            if (Boolean.TRUE.equals(request.presetHighTrafficZeroCart())) {
                predicates.add(criteriaBuilder.greaterThan(root.get("cumulativeClicks"), 20));
                predicates.add(criteriaBuilder.equal(root.get("cumulativeOrders"), 0));
            }

            if (Boolean.TRUE.equals(request.presetReadyToGraduate())) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("confidenceScore"), new BigDecimal("0.8")));
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("cumulativeOrders"), 5));
            }

            if (Boolean.TRUE.equals(request.presetProfitableButStarved())) {
                // New Filter: CVR >= 10% (0.1) but Impressions < 1000
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("cvr"), new BigDecimal("0.1")));
                predicates.add(criteriaBuilder.lessThan(root.get("cumulativeImpressions"), 1000));
            }

            // 2. CORE PERFORMANCE SLIDERS
            if (request.minSpend() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("cumulativeSpend"), request.minSpend()));
            }
            if (request.maxSpend() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("cumulativeSpend"), request.maxSpend()));
            }
            if (request.minOrders() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("cumulativeOrders"), request.minOrders()));
            }
            if (request.minCvr() != null) {
                // Assuming UI sends % (e.g., 5 for 5%), convert to decimal if needed, or if UI sends decimal, use directly
                // If your CVR is stored as a decimal (0.05), you may need to divide the request.minCvr() by 100 here.
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("cvr"), request.minCvr()));
            }

            // 3. STRUCTURAL FILTERS
            if (request.matchTypes() != null && !request.matchTypes().isEmpty()) {
                predicates.add(root.get("matchType").in(request.matchTypes()));
            }

            if (request.productIds() != null && !request.productIds().isEmpty()) {
                predicates.add(root.get("productId").in(request.productIds()));
            }
            if (request.keyword() != null && !request.keyword().isBlank()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("keyword")),
                        "%" + request.keyword().toLowerCase() + "%"
                ));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}