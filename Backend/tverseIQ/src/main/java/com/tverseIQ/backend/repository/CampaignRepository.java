package com.tverseIQ.backend.repository;

import com.tverseIQ.backend.model.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign,Long> {
    Optional<Campaign> findByCampaignName(String campaignName);
}
