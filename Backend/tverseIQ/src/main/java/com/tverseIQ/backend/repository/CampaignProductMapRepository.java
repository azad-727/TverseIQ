package com.tverseIQ.backend.repository;


import com.tverseIQ.backend.model.CampaignProductKey;
import com.tverseIQ.backend.model.CampaignProductMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CampaignProductMapRepository extends JpaRepository<CampaignProductMap, CampaignProductKey> {
@Query("SELECT cpm FROM CampaignProductMap cpm JOIN FETCH cpm.product WHERE cpm.campaign.campaignId = :campaignID")
List<CampaignProductMap> findByCampaignIdWithProducts(@Param("campaignId") Long campaignId);
}
