package com.tverseIQ.backend.service;

import com.tverseIQ.backend.model.Product;
import com.tverseIQ.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
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

    @Transactional
    public void deleteProduct(Long id) {
        Product existingProduct = getProductById(id);
        productRepository.delete(existingProduct);
    }
}