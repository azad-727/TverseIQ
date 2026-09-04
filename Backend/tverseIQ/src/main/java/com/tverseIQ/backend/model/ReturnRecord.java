package com.tverseIQ.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "tverse_return_records")
@Getter
@Setter
public class ReturnRecord {
    @Id
    @Column(nullable = false, unique = true)
    private String trackingId;

    @Column(nullable = false)
    private String sku;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private LocalDateTime returnDate;

    private String returnType;
}