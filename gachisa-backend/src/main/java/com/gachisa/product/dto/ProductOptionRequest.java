package com.gachisa.product.dto;

public record ProductOptionRequest(
    String optionName,
    String optionValue,
    int stock
) {}
