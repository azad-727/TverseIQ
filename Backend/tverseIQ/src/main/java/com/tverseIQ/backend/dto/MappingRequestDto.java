package com.tverseIQ.backend.dto;


import com.tverseIQ.backend.model.Platform;

public record MappingRequestDto(
        String channelProductId,
        Platform platform,
        Long productId
) { }
