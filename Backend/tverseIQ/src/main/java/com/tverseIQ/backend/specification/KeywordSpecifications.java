package com.tverseIQ.backend.specification;

import com.tverseIQ.backend.dto.DashboardDto.KeywordFilterRequest;
import com.tverseIQ.backend.model.ProductKeywordStats;
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
                // Clicks > 20 AND Orders = 0 (Listing issue, not traffic issue)
                predicates.add(criteriaBuilder.greaterThan(root.get("cumulativeClicks"), 20));
                predicates.add(criteriaBuilder.equal(root.get("cumulativeOrders"), 0));
            }

            if (Boolean.TRUE.equals(request.presetReadyToGraduate())) {
                // Confidence >= 0.8 AND Orders >= 5
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("confidenceScore"), new BigDecimal("0.8")));
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("cumulativeOrders"), 5));
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
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("cvr"), request.minCvr()));
            }

            // 3. STRUCTURAL FILTERS
            if (request.matchTypes() != null && !request.matchTypes().isEmpty()) {
                // Generates: WHERE match_type IN ('EXACT', 'PHRASE')
                predicates.add(root.get("matchType").in(request.matchTypes()));
            }

            // Combine all applied filters with a logical AND
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}