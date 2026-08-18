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

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="product_id",nullable = false)
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
