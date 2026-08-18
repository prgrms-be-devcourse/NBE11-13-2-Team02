package com.gachisa.product.dto;

public record ProductCreateRequest(
    String name,
    String description,
    int basePrice,
    int stock,
    Long categoryId
) {}
