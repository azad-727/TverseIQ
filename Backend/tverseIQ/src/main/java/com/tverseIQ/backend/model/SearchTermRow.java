package com.tverseIQ.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "search_term_row", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"upload_id", "product_id", "keyword", "match_type"})
})
@Getter
@Setter
public class SearchTermRow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "upload_id", nullable = false)
    private Long uploadId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false, length = 500)
    private String keyword;

    @Column(name = "match_type", length = 50)
    private String matchType;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Column(precision = 10, scale = 2)
    private BigDecimal spend;

    private Integer orders;

    @Column(precision = 10, scale = 2)
    private BigDecimal sales;
}
