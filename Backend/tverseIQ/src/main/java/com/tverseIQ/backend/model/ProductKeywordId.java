package com.tverseIQ.backend.model;

import jakarta.persistence.Entity;
import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ProductKeywordId implements Serializable {
    private Long productId;
    private String keyword;
}
