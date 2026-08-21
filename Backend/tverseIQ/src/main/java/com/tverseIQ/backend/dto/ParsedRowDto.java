package com.tverseIQ.backend.dto;

import java.math.BigDecimal;

public record ParsedRowDto (
        Long productId,
        String campaignName,
        String keyword,
        String matchType,
        Integer impressions,
        Integer clicks,
        BigDecimal spend,
        Integer orders,
        BigDecimal sales

){}
