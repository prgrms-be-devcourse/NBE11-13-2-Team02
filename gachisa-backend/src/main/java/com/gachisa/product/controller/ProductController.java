package com.gachisa.product.controller;

import com.gachisa.global.security.CustomUserDetails;
import com.gachisa.product.dto.ProductCreateRequest;
import com.gachisa.product.dto.ProductResponse;
import com.gachisa.product.dto.ProductUpdateRequest;
import com.gachisa.product.service.ProductService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SELLER')")
    public ProductResponse createProduct(@AuthenticationPrincipal CustomUserDetails userDetails,
                                          @RequestBody ProductCreateRequest request) {
        return productService.createProduct(userDetails.getUserId(), request);
    }

    @GetMapping
    public List<ProductResponse> getProducts() {
        return productService.getProducts();
    }

    @GetMapping("/{productId}")
    public ProductResponse getProduct(@PathVariable Long productId) {
        return productService.getProduct(productId);
    }

    @GetMapping("/search")
    public List<ProductResponse> searchProducts(@RequestParam(required = false) Long categoryId,
                                                 @RequestParam(required = false) Integer minPrice,
                                                 @RequestParam(required = false) Integer maxPrice,
                                                 @RequestParam(required = false) String keyword) {
        return productService.searchProducts(categoryId, minPrice, maxPrice, keyword);
    }

    @PatchMapping("/{productId}")
    @PreAuthorize("hasRole('SELLER')")
    public ProductResponse updateProduct(@AuthenticationPrincipal CustomUserDetails userDetails,
                                          @PathVariable Long productId,
                                          @RequestBody ProductUpdateRequest request) {
        return productService.updateProduct(productId, userDetails.getUserId(), request);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('SELLER')")
    public void deleteProduct(@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long productId) {
        productService.deleteProduct(productId, userDetails.getUserId());
    }

    @PatchMapping("/{productId}/resume")
    @PreAuthorize("hasRole('SELLER')")
    public ProductResponse resumeProduct(@AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long productId) {
        return productService.resumeProduct(productId, userDetails.getUserId());
    }
}
