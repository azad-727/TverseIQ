package com.tverseIQ.backend.controller;

import com.tverseIQ.backend.dto.ProductDto;
import com.tverseIQ.backend.model.Product;
import com.tverseIQ.backend.service.ProductService;
import com.tverseIQ.backend.service.ReturnAnalyticsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;
    private final ReturnAnalyticsService returnAnalyticsService;

    public ProductController(ProductService productService,ReturnAnalyticsService returnAnalyticsService) {
        this.productService = productService;
        this.returnAnalyticsService=returnAnalyticsService;
    }


    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    // Manual Add - Crucial for Phase 0/1 testing
    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        Product savedProduct = productService.createProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product productDetails) {
        Product updatedProduct = productService.updateProduct(id, productDetails);
        return ResponseEntity.ok(updatedProduct);
    }
    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts(
            @RequestParam(required = false) String mappingStatus
    ) {
        return ResponseEntity.ok(productService.getProductsWithMappingStatus(mappingStatus));
    }
    @PostMapping("/bulk-map-channel")
    public ResponseEntity<?> uploadBulkChannelMapping(@RequestParam("file") MultipartFile file) {
        try {
            int mappedCount = productService.processBulkChannelMapping(file);
            return ResponseEntity.ok(Map.of("message", "Successfully mapped " + mappedCount + " channels."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Bulk upload failed: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/analytics/returns/{sku}")
    public ResponseEntity<?> getLocalReturnRate(@PathVariable String sku) {
        try {
            return ResponseEntity.ok(returnAnalyticsService.calculateReturnRate(sku));
        } catch (Exception e) {
            // Return 0 so the frontend doesn't crash if an error occurs
            return ResponseEntity.ok(Map.of("sku", sku, "returnRatePct", 0.0));
        }
    }
}