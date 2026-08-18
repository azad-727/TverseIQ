package com.tverseIQ.backend.controller;

import com.tverseIQ.backend.dto.MappingRequestDto;
import com.tverseIQ.backend.model.ChannelSkuMap;
import com.tverseIQ.backend.model.Product;
import com.tverseIQ.backend.repository.ChannelSkuMapRepository;
import com.tverseIQ.backend.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/mappings")
@CrossOrigin(origins = "*")
public class MappingController {

    private final ChannelSkuMapRepository channelSkuMapRepository;
    private final ProductRepository productRepository;

    public MappingController(ChannelSkuMapRepository channelSkuMapRepository, ProductRepository productRepository) {
        this.channelSkuMapRepository = channelSkuMapRepository;
        this.productRepository = productRepository;
    }

    @PostMapping("/create")
    public ResponseEntity<?> createMapping(@RequestBody MappingRequestDto request) {

        Optional<Product> productOpt = productRepository.findById(request.productId());
        if (productOpt.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Product not found with ID: " + request.productId());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }

        Optional<ChannelSkuMap> existingMap = channelSkuMapRepository
                .findByChannelProductIdAndPlatform(request.channelProductId(), request.platform());

        if (existingMap.isPresent()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Mapping already exists for this channel ID and platform.");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        }

        ChannelSkuMap newMap = new ChannelSkuMap();
        newMap.setChannelProductId(request.channelProductId());
        newMap.setPlatform(request.platform());
        newMap.setProduct(productOpt.get());
        newMap.setMappedDate(LocalDateTime.now());

        channelSkuMapRepository.save(newMap);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Omni-Channel Mapping created successfully.");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/all")
    public ResponseEntity<List<ChannelSkuMap>> getAllMappings() {
        List<ChannelSkuMap> mappings = channelSkuMapRepository.findAll();
        return ResponseEntity.ok(mappings);
    }
}