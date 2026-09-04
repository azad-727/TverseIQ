package com.tverseIQ.backend.controller;

import com.tverseIQ.backend.model.Product;
import com.tverseIQ.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.Map;
import java.util.List;
import java.util.Collections;

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

            while (hasNext) {
                String url = tverseBaseUrl + "/api/catalog/list?pageSize=160";
                if (cursor != null && !cursor.isEmpty()) {
                    url += "&cursor=" + cursor;
                }

                ResponseEntity<Map> response = restTemplate.exchange(
                        url,
                        HttpMethod.GET,
                        entity,
                        Map.class
                );

                Map<String, Object> body = response.getBody();
                if (body == null || !body.containsKey("items")) break;

                List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("items");

                for (Map<String, Object> item : items) {
                    String sku = (String) item.get("sku");
                    String productName = (String) item.get("productName");
                    String category = (String) item.get("category");

                    if (sku == null || sku.isEmpty()) continue;

                    Product p = productRepository.findBySku(sku).orElse(new Product());
                    p.setSku(sku);
                    p.setName(productName != null ? productName : "Unknown");
                    p.setCategory(category != null ? category : "-");
                    productRepository.save(p);
                    totalSynced++;
                }

                hasNext = Boolean.TRUE.equals(body.get("hasNext"));
                cursor = (String) body.get("nextCursor");
            }
            return ResponseEntity.ok(Map.of("message", "Successfully synced " + totalSynced + " products from Tverse."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(502).body(Map.of("error", "Failed to sync from Tverse: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginToTverse(@RequestBody Map<String, String> credentials) {
        try {
            String url = tverseBaseUrl + "/api/auth/login";
            ResponseEntity<Map> response = restTemplate.postForEntity(url, credentials, Map.class);
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "Failed to connect to Tverse auth: " + e.getMessage()));
        }
    }

    @GetMapping("/analytics/abc")
    public ResponseEntity<?> getAbcAnalytics() {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", tverseApiKey);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            String url = tverseBaseUrl + "/api/catalog/analytics/abc";
            ResponseEntity<List> response = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);

            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }
}