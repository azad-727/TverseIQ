package com.tverseIQ.backend.repository;

import com.tverseIQ.backend.model.ProductKeywordId;
import com.tverseIQ.backend.model.ProductKeywordStats;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ProductKeywordStatsRepository extends JpaRepository<ProductKeywordStats, ProductKeywordId> {

    Page<ProductKeywordStats> findByProductId(Long productId, Pageable pageable);

    @Query("""
        SELECT p FROM ProductKeywordStats p 
        WHERE p.productId = :productId 
          AND (p.cumulativeOrders < :lastOrders OR (p.cumulativeOrders = :lastOrders AND p.keyword > :lastKeyword))
        ORDER BY p.cumulativeOrders DESC, p.keyword ASC
        LIMIT :limit
          """)
    List<ProductKeywordStats> findTopKeywordKeyset(
        @Param("productId") Long productId,
        @Param("lastOrders") Long lastOrders,
        @Param("lastKeyword") String lastKeyword,
        @Param("limit") int limit
        );

    @Query("""
        SELECT 
            COALESCE(SUM(p.cumulativeSpend), 0), 
            COALESCE(SUM(p.cumulativeSales), 0), 
            COALESCE(SUM(p.cumulativeOrders), 0) 
        FROM ProductKeywordStats p
    """)
    List<Object[]> getRawGlobalSums();

    Page<ProductKeywordStats> findAll(Specification<ProductKeywordStats> spec, Pageable pageable);

}

