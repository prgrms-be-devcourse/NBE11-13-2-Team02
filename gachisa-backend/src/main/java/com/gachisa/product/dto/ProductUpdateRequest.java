package com.gachisa.product.dto;

public record ProductUpdateRequest(
    String name,
    String description,
    Integer basePrice,
    Long categoryId,
    String imageUrl
) {}
