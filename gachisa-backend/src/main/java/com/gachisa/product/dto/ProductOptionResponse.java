package com.gachisa.product.dto;

import com.gachisa.product.entity.ProductOption;

public record ProductOptionResponse(
    Long id,
    String optionName,
    String optionValue,
    int stock
) {
    public static ProductOptionResponse from(ProductOption option) {
        return new ProductOptionResponse(option.getId(), option.getOptionName(), option.getOptionValue(), option.getStock());
    }
}
