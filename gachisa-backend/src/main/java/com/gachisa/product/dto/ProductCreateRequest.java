package com.gachisa.product.dto;

import java.util.List;

public record ProductCreateRequest(
    String name,
    String description,
    int basePrice,
    Long categoryId,
    String imageUrl,
    List<ProductOptionRequest> options
) {}
