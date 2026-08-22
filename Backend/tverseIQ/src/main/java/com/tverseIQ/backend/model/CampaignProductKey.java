package com.tverseIQ.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Entity;
import lombok.*;

@Embeddable
@Getter
@Setter
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
public class CampaignProductKey {

    @Column(name="campaign_id")
    private Long campaignId;

    @Column(name="product_id")
    private Long productId;

}

