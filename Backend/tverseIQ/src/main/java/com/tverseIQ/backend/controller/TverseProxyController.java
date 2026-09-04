package com.tverseIQ.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

@RestController
@RequestMapping("/api/v1/tverse")
@CrossOrigin(origins = "*")
public class TverseProxyController {

    @Value("${tverse.api.base-url}")
    private String tverseBaseUrl;

    @Value("${tverse.api.key}")
    private String tverseApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Proxy endpoint — browser calls THIS, backend calls Tverse with the secret key.
     * The API key never leaves the server.
     */
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
}