package com.gachisa.product.controller;

import com.gachisa.global.security.CustomUserDetails;
import com.gachisa.product.dto.ProductOptionRequest;
import com.gachisa.product.dto.ProductOptionResponse;
import com.gachisa.product.dto.ProductOptionStockAdjustRequest;
import com.gachisa.product.service.ProductOptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products/{productId}/options")
public class ProductOptionController {

    private final ProductOptionService productOptionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SELLER')")
    public ProductOptionResponse addOption(@AuthenticationPrincipal CustomUserDetails userDetails,
                                            @PathVariable Long productId,
                                            @RequestBody ProductOptionRequest request) {
        return productOptionService.addOption(productId, userDetails.getUserId(), request);
    }

    @PatchMapping("/{optionId}")
    @PreAuthorize("hasRole('SELLER')")
    public ProductOptionResponse adjustStock(@AuthenticationPrincipal CustomUserDetails userDetails,
                                              @PathVariable Long productId,
                                              @PathVariable Long optionId,
                                              @RequestBody ProductOptionStockAdjustRequest request) {
        return productOptionService.adjustStock(productId, optionId, userDetails.getUserId(), request.quantity());
    }
}
