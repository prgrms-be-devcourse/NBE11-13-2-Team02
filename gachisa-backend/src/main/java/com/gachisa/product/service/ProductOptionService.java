package com.gachisa.product.service;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.product.dto.ProductOptionRequest;
import com.gachisa.product.dto.ProductOptionResponse;
import com.gachisa.product.entity.Product;
import com.gachisa.product.entity.ProductOption;
import com.gachisa.product.repository.ProductOptionRepository;
import com.gachisa.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductOptionService {

    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;

    @Transactional
    public ProductOptionResponse addOption(Long productId, Long sellerId, ProductOptionRequest request) {
        Product product = getProductOrThrow(productId);
        validateOwner(product, sellerId);

        ProductOption option = ProductOption.builder()
            .product(product)
            .optionName(request.optionName())
            .optionValue(request.optionValue())
            .stock(request.stock())
            .build();

        return ProductOptionResponse.from(productOptionRepository.save(option));
    }

    @Transactional
    public ProductOptionResponse adjustStock(Long productId, Long optionId, Long sellerId, int quantity) {
        Product product = getProductOrThrow(productId);
        validateOwner(product, sellerId);
        ProductOption option = getOptionOrThrow(productId, optionId);

        if (quantity > 0) {
            option.increaseStock(quantity);
        } else if (quantity < 0) {
            try {
                option.decreaseStock(-quantity);
            } catch (IllegalArgumentException e) {
                throw new CustomException(ErrorCode.INSUFFICIENT_STOCK);
            }
        }

        return ProductOptionResponse.from(option);
    }

    private Product getProductOrThrow(Long productId) {
        return productRepository.findById(productId)
            .orElseThrow(() -> new CustomException(ErrorCode.PRODUCT_NOT_FOUND));
    }

    private ProductOption getOptionOrThrow(Long productId, Long optionId) {
        ProductOption option = productOptionRepository.findById(optionId)
            .orElseThrow(() -> new CustomException(ErrorCode.PRODUCT_OPTION_NOT_FOUND));
        if (!option.getProduct().getId().equals(productId)) {
            throw new CustomException(ErrorCode.PRODUCT_OPTION_NOT_FOUND);
        }
        return option;
    }

    private void validateOwner(Product product, Long sellerId) {
        if (!product.isOwnedBy(sellerId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
