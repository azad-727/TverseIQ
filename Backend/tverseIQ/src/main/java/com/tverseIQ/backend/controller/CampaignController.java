package com.tverseIQ.backend.controller;

import com.tverseIQ.backend.model.Campaign;
import com.tverseIQ.backend.service.CampaignService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/campaigns")
public class CampaignController {

    private final CampaignService campaignService;

    public CampaignController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    @GetMapping
    public ResponseEntity<List<Campaign>> getAllCampaigns() {
        return ResponseEntity.ok(campaignService.getAllCampaigns());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Campaign> getCampaignById(@PathVariable Long id) {
        return ResponseEntity.ok(campaignService.getCampaignById(id));
    }

    @PostMapping
    public ResponseEntity<Campaign> createCampaign(@RequestBody Campaign campaign) {
        Campaign saved = campaignService.createCampaign(campaign);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Campaign> updateCampaign(@PathVariable Long id, @RequestBody Campaign campaignDetails) {
        return ResponseEntity.ok(campaignService.updateCampaign(id, campaignDetails));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampaign(@PathVariable Long id) {
        campaignService.deleteCampaign(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/map-products")
    public ResponseEntity<String> mapProducts(@PathVariable Long id, @RequestBody List<Long> productIds) {
        campaignService.mapProductsToCampaign(id, productIds);
        return ResponseEntity.ok("Successfully mapped " + productIds.size() + " products to campaign " + id);
    }
}