package com.tverseIQ.backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name="channel_sku_map", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"channel_product_id","platform"})
})
public class ChannelSkuMap {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long mapId;

    @JoinColumn(name="product_id",nullable = false)
    @ManyToOne(fetch=FetchType.LAZY)
    private Product product;

    @Column(name="channel_product_id", nullable = false,length = 64)
    private String channelProductId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Platform platform;

    @Column(name = "mapped_date", nullable = false)
    private LocalDateTime mappedDate;

    @PrePersist
    protected void onCreate() {
        this.mappedDate = LocalDateTime.now();
    }

}
