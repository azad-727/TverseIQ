package com.tverseIQ.backend.dto;

public record ParsedRowDto (
        Long productId,
        String campaginName,
        String keyword,
        String matchType
){}
