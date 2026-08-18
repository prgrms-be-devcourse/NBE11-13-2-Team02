package com.gachisa.product.service;

import com.gachisa.category.entity.Category;
import com.gachisa.category.repository.CategoryRepository;
import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.product.dto.ProductCreateRequest;
import com.gachisa.product.dto.ProductOptionRequest;
import com.gachisa.product.dto.ProductPaymentInfo;
import com.gachisa.product.dto.ProductResponse;
import com.gachisa.product.dto.ProductUpdateRequest;
import com.gachisa.product.entity.Product;
import com.gachisa.product.entity.ProductOption;
import com.gachisa.product.entity.ProductStatus;
import com.gachisa.product.repository.ProductOptionRepository;
import com.gachisa.product.repository.ProductRepository;
import com.gachisa.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private static final String DEFAULT_OPTION_NAME = "기타";
    private static final String DEFAULT_OPTION_VALUE = "기본";

    private final ProductRepository productRepository;
    private final ProductOptionRepository productOptionRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProductResponse createProduct(Long sellerId, ProductCreateRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
            .orElseThrow(() -> new CustomException(ErrorCode.CATEGORY_NOT_FOUND));

        Product product = Product.builder()
            .seller(userRepository.getReferenceById(sellerId))
            .category(category)
            .name(request.name())
            .description(request.description())
            .basePrice(request.basePrice())
            .imageUrl(request.imageUrl())
            .status(ProductStatus.ON_SALE)
            .createdAt(LocalDateTime.now())
            .build();
        productRepository.save(product);

        List<ProductOptionRequest> optionRequests = request.options();
        List<ProductOption> options = (optionRequests == null || optionRequests.isEmpty())
            ? List.of(ProductOption.builder()
                .product(product)
                .optionName(DEFAULT_OPTION_NAME)
                .optionValue(DEFAULT_OPTION_VALUE)
                .stock(0)
                .build())
            : optionRequests.stream()
                .map(o -> ProductOption.builder()
                    .product(product)
                    .optionName(o.optionName())
                    .optionValue(o.optionValue())
                    .stock(o.stock())
                    .build())
                .collect(Collectors.toList());
        productOptionRepository.saveAll(options);

        return ProductResponse.of(product, options);
    }

    public List<ProductResponse> getProducts() {
        return productRepository.findAll().stream()
            .map(product -> ProductResponse.of(product, productOptionRepository.findByProductId(product.getId())))
            .collect(Collectors.toList());
    }

    public ProductResponse getProduct(Long productId) {
        Product product = getProductOrThrow(productId);
        return ProductResponse.of(product, productOptionRepository.findByProductId(productId));
    }

    public ProductPaymentInfo getPaymentInfo(Long productId) {
        Product product = getProductOrThrow(productId);
        return new ProductPaymentInfo(product.getId(), product.getBasePrice());
    }

    public List<ProductResponse> searchProducts(Long categoryId, Integer minPrice, Integer maxPrice, String keyword) {
        return productRepository.search(categoryId, minPrice, maxPrice, keyword).stream()
            .map(product -> ProductResponse.of(product, productOptionRepository.findByProductId(product.getId())))
            .collect(Collectors.toList());
    }

    @Transactional
    public ProductResponse updateProduct(Long productId, Long sellerId, ProductUpdateRequest request) {
        Product product = getProductOrThrow(productId);
        validateOwner(product, sellerId);

        if (request.name() != null && !request.name().isBlank()) {
            product.updateName(request.name());
        }
        if (request.description() != null) {
            product.updateDescription(request.description());
        }
        if (request.basePrice() != null) {
            product.updateBasePrice(request.basePrice());
        }
        if (request.imageUrl() != null) {
            product.updateImageUrl(request.imageUrl());
        }
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new CustomException(ErrorCode.CATEGORY_NOT_FOUND));
            product.updateCategory(category);
        }

        return ProductResponse.of(product, productOptionRepository.findByProductId(productId));
    }

    @Transactional
    public void deleteProduct(Long productId, Long sellerId) {
        Product product = getProductOrThrow(productId);
        validateOwner(product, sellerId);
        product.stopSale();
    }

    @Transactional
    public ProductResponse resumeProduct(Long productId, Long sellerId) {
        Product product = getProductOrThrow(productId);
        validateOwner(product, sellerId);
        product.resumeSale();
        return ProductResponse.of(product, productOptionRepository.findByProductId(productId));
    }

    private Product getProductOrThrow(Long productId) {
        return productRepository.findById(productId)
            .orElseThrow(() -> new CustomException(ErrorCode.PRODUCT_NOT_FOUND));
    }

    private void validateOwner(Product product, Long sellerId) {
        if (!product.isOwnedBy(sellerId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
