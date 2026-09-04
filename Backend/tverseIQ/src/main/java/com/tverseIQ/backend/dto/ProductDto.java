package com.tverseIQ.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class ProductDto {
    private Long productId;
    private String sku;
    private String name;
    private String category;
    private List<String> mappedPlatforms; // e.g. ["AMAZON", "FLIPKART"]
    private boolean isMapped; // True if mappedPlatforms is not empty
}