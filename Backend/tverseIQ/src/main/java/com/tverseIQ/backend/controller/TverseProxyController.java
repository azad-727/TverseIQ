package com.tverseIQ.backend.controller;

import com.tverseIQ.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/tverse")
@CrossOrigin(origins = "*")
public class TverseProxyController {

    @Value("${tverse.api.base-url}")
    private String tverseBaseUrl;

    @Value("${tverse.api.key}")
    private String tverseApiKey;

    @Autowired
    private ProductRepository productRepository;


    private final RestTemplate restTemplate = new RestTemplate();


    @GetMapping("/catalog/{sku}")
    public ResponseEntity<?> getProductDetail(@PathVariable String sku) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", tverseApiKey);

            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    tverseBaseUrl + "/api/catalog/detail/" + sku,
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response.getBody());

        } catch (Exception e) {
            return ResponseEntity.status(502)
                    .body("{\"error\": \"Failed to fetch from Tverse: " + e.getMessage() + "\"}");
        }
    }
    @PostMapping("/sync-catalog")
    public ResponseEntity<?> syncCatalog() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", tverseApiKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            String cursor = null;
            boolean hasNext = true;
            int totalSynced = 0;
            // Handle the cursor-based pagination loop
            while (hasNext) {
                String url = tverseBaseUrl + "/api/catalog/list?pageSize=160";
                if (cursor != null && !cursor.isEmpty()) {
                    url += "&cursor=" + cursor;
                }
                ResponseEntity<java.util.Map> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        java.util.Map.class
                );
                Map<String, Object> body = response.getBody();
                if (body == null || !body.containsKey("items")) break;
                java.util.List<java.util.Map<String, Object>> items =
                        (java.util.List<java.util.Map<String, Object>>) body.get("items");

                for (java.util.Map<String, Object> item : items) {
                    String sku = (String) item.get("sku");
                    String productName = (String) item.get("productName");
                    String category = (String) item.get("category");
                    if (sku == null || sku.isEmpty()) continue;
                    // Idempotent Save: Find by SKU or create a new empty one
                    com.tverseIQ.backend.model.Product p = productRepository.findBySku(sku)
                            .orElse(new com.tverseIQ.backend.model.Product());

                    p.setSku(sku);
                    p.setName(productName != null ? productName : "Unknown");
                    p.setCategory(category != null ? category : "-");
                    productRepository.save(p);
                    totalSynced++;
                }
                hasNext = Boolean.TRUE.equals(body.get("hasNext"));
                cursor = (String) body.get("nextCursor");
            }
            return ResponseEntity.ok(java.util.Map.of("message", "Successfully synced " + totalSynced + " products from Tverse."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(502)
                    .body(java.util.Map.of("error", "Failed to sync from Tverse: " + e.getMessage()));
        }
    }
}