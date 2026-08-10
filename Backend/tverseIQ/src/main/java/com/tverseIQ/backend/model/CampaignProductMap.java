package com.tverseIQ.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name="campaign_product_map")
@Getter
@Setter
public class CampaignProductMap {

    @EmbeddedId
    private CampaignProductKey id;

    @ManyToOne(fetch= FetchType.LAZY)
    @MapsId("campaignId")
    @JoinColumn(name="campaign_id")
    private Campaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("productId")
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private LocalDate mappedData;


}
