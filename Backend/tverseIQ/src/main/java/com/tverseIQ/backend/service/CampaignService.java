package com.tverseIQ.backend.service;

import com.tverseIQ.backend.model.Campaign;
import com.tverseIQ.backend.model.CampaignProductMap;
import com.tverseIQ.backend.model.CampaignProductKey;
import com.tverseIQ.backend.repository.CampaignRepository;
import com.tverseIQ.backend.repository.CampaignProductMapRepository;
import com.tverseIQ.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final CampaignProductMapRepository campaignProductMapRepository;
    private final ProductRepository productRepository;

    public CampaignService(CampaignRepository campaignRepository,
                           CampaignProductMapRepository campaignProductMapRepository,
                           ProductRepository productRepository) {
        this.campaignRepository = campaignRepository;
        this.campaignProductMapRepository = campaignProductMapRepository;
        this.productRepository = productRepository;
    }

    public List<Campaign> getAllCampaigns() {
        return campaignRepository.findAll();
    }

    public Campaign getCampaignById(Long id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found with id: " + id));
    }

    @Transactional
    public Campaign createCampaign(Campaign campaign) {
        return campaignRepository.save(campaign);
    }

    @Transactional
    public Campaign updateCampaign(Long id, Campaign campaignDetails) {
        Campaign existing = getCampaignById(id);

        if (campaignDetails.getCampaignName() != null) {
            existing.setCampaignName(campaignDetails.getCampaignName());
        }
        // Update other fields like status, budget, etc. based on your entity

        return campaignRepository.save(existing);
    }

    @Transactional
    public void deleteCampaign(Long id) {
        Campaign existing = getCampaignById(id);
        campaignRepository.delete(existing);
    }

    @Transactional
    public void mapProductsToCampaign(Long campaignId, List<Long> productIds) {
        Campaign campaign = getCampaignById(campaignId);

        // Clear existing mappings if this is a strict overwrite
        // campaignProductMapRepository.deleteByCampaignId(campaignId);

        for (Long productId : productIds) {
            // Verify product exists
            productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

            // Build the composite key and mapping using your custom entities
            CampaignProductKey key = new CampaignProductKey (campaignId, productId);
            CampaignProductMap mapping = new CampaignProductMap();
            mapping.setId(key);

            campaignProductMapRepository.save(mapping);
        }
    }
}