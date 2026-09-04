package com.tverseIQ.backend.service;

import com.tverseIQ.backend.dto.ProductDto;
import com.tverseIQ.backend.model.ChannelSkuMap;
import com.tverseIQ.backend.model.Product;
import com.tverseIQ.backend.repository.ChannelSkuMapRepository;
import com.tverseIQ.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ChannelSkuMapRepository channelSkuMapRepository;

    public ProductService(ProductRepository productRepository,ChannelSkuMapRepository channelSkuMapRepository) {
        this.productRepository = productRepository;
        this.channelSkuMapRepository=channelSkuMapRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    @Transactional
    public Product createProduct(Product product) {
        // Ensure ID is null so Hibernate knows to INSERT, not UPDATE
        product.setProductId(null);
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, Product productDetails) {
        Product existingProduct = getProductById(id);

        // Assuming standard fields based on our earlier KeywordDeepDiveDto mapping
        if(productDetails.getName() != null) {
            existingProduct.setName(productDetails.getName());
        }
        if(productDetails.getSku() != null) {
            existingProduct.setSku(productDetails.getSku());
        }

        return productRepository.save(existingProduct);
    }

    public List<ProductDto> getProductsWithMappingStatus(String mappingStatus) {
        List<Product> allProducts = productRepository.findAll();

        List<ProductDto> dtos = allProducts.stream().map(product -> {
            List<ChannelSkuMap> mappings = channelSkuMapRepository.findByProduct(product);
            List<String> platforms = mappings.stream()
                    .map(m -> m.getPlatform().name())
                    .distinct()
                    .collect(Collectors.toList());

            return new ProductDto(
                    product.getProductId(),
                    product.getSku(),
                    product.getName(),
                    product.getCategory(),
                    platforms,
                    !platforms.isEmpty()
            );
        }).collect(Collectors.toList());
        if ("MAPPED".equalsIgnoreCase(mappingStatus)) {
            return dtos.stream().filter(ProductDto::isMapped).collect(Collectors.toList());
        } else if ("UNMAPPED".equalsIgnoreCase(mappingStatus)) {
            return dtos.stream().filter(p -> !p.isMapped()).collect(Collectors.toList());
        }

        return dtos; // Returns all if no filter
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product existingProduct = getProductById(id);
        productRepository.delete(existingProduct);
    }
}