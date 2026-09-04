package com.tverseIQ.backend.service;

import com.tverseIQ.backend.dto.ProductDto;
import com.tverseIQ.backend.model.ChannelSkuMap;
import com.tverseIQ.backend.model.Platform;
import com.tverseIQ.backend.model.Product;
import com.tverseIQ.backend.repository.ChannelSkuMapRepository;
import com.tverseIQ.backend.repository.ProductRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
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
    @Transactional
    public int processBulkChannelMapping(MultipartFile file) throws Exception {
        int mappedCount = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            boolean isFirstRow = true;

            for (Row row : sheet) {
                if (isFirstRow) { isFirstRow = false; continue; } // Skip header

                if (row.getCell(0) == null || row.getCell(1) == null || row.getCell(2) == null) continue;

                String sku = row.getCell(0).getStringCellValue();
                String platformStr = row.getCell(1).getStringCellValue();
                String channelProductId = row.getCell(2).getStringCellValue();

                Product product = productRepository.findBySku(sku).orElse(null);

                if (product != null) {
                    ChannelSkuMap mapping = new ChannelSkuMap();
                    mapping.setProduct(product);
                    mapping.setPlatform(Platform.valueOf(platformStr.toUpperCase()));
                    mapping.setChannelProductId(channelProductId);

                    channelSkuMapRepository.save(mapping);
                    mappedCount++;
                }
            }
        }
        return mappedCount;
    }
}