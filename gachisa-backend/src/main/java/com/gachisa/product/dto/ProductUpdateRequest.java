package com.gachisa.product.dto;

public record ProductUpdateRequest(
    String name,
    String description,
    Integer basePrice,
    Integer stock,
    Long categoryId
) {}
