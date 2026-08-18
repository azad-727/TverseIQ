package com.tverseIQ.backend.dto;

import java.math.BigDecimal;

public record ParsedRowDto (
        Long productId,
        String campaginName,
        String keyword,
        String matchType,
        BigDecimal spend,
        Integer orders,
        BigDecimal sales

){}
