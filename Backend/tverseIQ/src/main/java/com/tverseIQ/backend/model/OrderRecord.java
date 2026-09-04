package com.tverseIQ.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "tverse_order_records")
@Getter
@Setter
public class OrderRecord {
    @Id
    @Column(nullable = false, unique = true)
    private String orderId;

    @Column(nullable = false)
    private String sku;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private LocalDateTime orderDate;

    private String channel;
}