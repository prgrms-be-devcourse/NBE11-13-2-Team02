package com.gachisa.product.dto;

import com.gachisa.product.entity.Product;
import com.gachisa.product.entity.ProductOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public record ProductResponse(
    Long id,
    Long sellerId,
    String sellerName,
    Long categoryId,
    String categoryName,
    String name,
    String description,
    int basePrice,
    String imageUrl,
    String status,
    LocalDateTime createdAt,
    List<ProductOptionResponse> options
) {
    public static ProductResponse of(Product product, List<ProductOption> options) {
        return new ProductResponse(
            product.getId(),
            product.getSeller().getId(),
            product.getSeller().getName(),
            product.getCategory().getId(),
            product.getCategory().getName(),
            product.getName(),
            product.getDescription(),
            product.getBasePrice(),
            product.getImageUrl(),
            product.getStatus().name(),
            product.getCreatedAt(),
            options.stream().map(ProductOptionResponse::from).collect(Collectors.toList())
        );
    }
}
