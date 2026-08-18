package com.gachisa.product.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.gachisa.category.entity.Category;
import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.product.dto.ProductOptionRequest;
import com.gachisa.product.dto.ProductOptionResponse;
import com.gachisa.product.entity.Product;
import com.gachisa.product.entity.ProductOption;
import com.gachisa.product.entity.ProductStatus;
import com.gachisa.product.repository.ProductOptionRepository;
import com.gachisa.product.repository.ProductRepository;
import com.gachisa.user.entity.User;
import com.gachisa.user.entity.UserRole;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ProductOptionServiceTest {

    private static final Long PRODUCT_ID = 1L;
    private static final Long OTHER_PRODUCT_ID = 2L;
    private static final Long OPTION_ID = 10L;
    private static final Long SELLER_ID = 100L;
    private static final Long OTHER_SELLER_ID = 200L;
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 18, 12, 0);

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductOptionRepository productOptionRepository;

    private ProductOptionService productOptionService;

    @BeforeEach
    void setUp() {
        productOptionService = new ProductOptionService(productRepository, productOptionRepository);
    }

    @Test
    void addOptionCreatesOptionWhenOwner() {
        Product product = product(PRODUCT_ID, SELLER_ID);
        given(productRepository.findById(PRODUCT_ID)).willReturn(Optional.of(product));
        given(productOptionRepository.save(org.mockito.ArgumentMatchers.any(ProductOption.class)))
                .willAnswer(invocation -> invocation.getArgument(0));
        ProductOptionRequest request = new ProductOptionRequest("색상", "빨강", 10);

        ProductOptionResponse response = productOptionService.addOption(PRODUCT_ID, SELLER_ID, request);

        assertThat(response.optionName()).isEqualTo("색상");
        assertThat(response.optionValue()).isEqualTo("빨강");
        assertThat(response.stock()).isEqualTo(10);
    }

    @Test
    void addOptionThrowsWhenNotOwner() {
        Product product = product(PRODUCT_ID, SELLER_ID);
        given(productRepository.findById(PRODUCT_ID)).willReturn(Optional.of(product));
        ProductOptionRequest request = new ProductOptionRequest("색상", "빨강", 10);

        assertThatThrownBy(() -> productOptionService.addOption(PRODUCT_ID, OTHER_SELLER_ID, request))
                .isInstanceOf(CustomException.class)
                .extracting(exception -> ((CustomException) exception).getErrorCode())
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void addOptionThrowsWhenProductNotFound() {
        given(productRepository.findById(PRODUCT_ID)).willReturn(Optional.empty());
        ProductOptionRequest request = new ProductOptionRequest("색상", "빨강", 10);

        assertThatThrownBy(() -> productOptionService.addOption(PRODUCT_ID, SELLER_ID, request))
                .isInstanceOf(CustomException.class)
                .extracting(exception -> ((CustomException) exception).getErrorCode())
                .isEqualTo(ErrorCode.PRODUCT_NOT_FOUND);
    }

    @Test
    void adjustStockIncreasesStock() {
        Product product = product(PRODUCT_ID, SELLER_ID);
        ProductOption option = option(OPTION_ID, product, 10);
        given(productRepository.findById(PRODUCT_ID)).willReturn(Optional.of(product));
        given(productOptionRepository.findById(OPTION_ID)).willReturn(Optional.of(option));

        ProductOptionResponse response = productOptionService.adjustStock(PRODUCT_ID, OPTION_ID, SELLER_ID, 20);

        assertThat(response.stock()).isEqualTo(30);
    }

    @Test
    void adjustStockDecreasesStock() {
        Product product = product(PRODUCT_ID, SELLER_ID);
        ProductOption option = option(OPTION_ID, product, 10);
        given(productRepository.findById(PRODUCT_ID)).willReturn(Optional.of(product));
        given(productOptionRepository.findById(OPTION_ID)).willReturn(Optional.of(option));

        ProductOptionResponse response = productOptionService.adjustStock(PRODUCT_ID, OPTION_ID, SELLER_ID, -7);

        assertThat(response.stock()).isEqualTo(3);
    }

    @Test
    void adjustStockThrowsWhenInsufficientStock() {
        Product product = product(PRODUCT_ID, SELLER_ID);
        ProductOption option = option(OPTION_ID, product, 5);
        given(productRepository.findById(PRODUCT_ID)).willReturn(Optional.of(product));
        given(productOptionRepository.findById(OPTION_ID)).willReturn(Optional.of(option));

        assertThatThrownBy(() -> productOptionService.adjustStock(PRODUCT_ID, OPTION_ID, SELLER_ID, -10))
                .isInstanceOf(CustomException.class)
                .extracting(exception -> ((CustomException) exception).getErrorCode())
                .isEqualTo(ErrorCode.INSUFFICIENT_STOCK);
        assertThat(option.getStock()).isEqualTo(5);
    }

    @Test
    void adjustStockThrowsWhenOptionBelongsToDifferentProduct() {
        Product product = product(PRODUCT_ID, SELLER_ID);
        Product otherProduct = product(OTHER_PRODUCT_ID, SELLER_ID);
        ProductOption option = option(OPTION_ID, otherProduct, 10);
        given(productRepository.findById(PRODUCT_ID)).willReturn(Optional.of(product));
        given(productOptionRepository.findById(OPTION_ID)).willReturn(Optional.of(option));

        assertThatThrownBy(() -> productOptionService.adjustStock(PRODUCT_ID, OPTION_ID, SELLER_ID, 5))
                .isInstanceOf(CustomException.class)
                .extracting(exception -> ((CustomException) exception).getErrorCode())
                .isEqualTo(ErrorCode.PRODUCT_OPTION_NOT_FOUND);
    }

    @Test
    void adjustStockThrowsWhenNotOwner() {
        Product product = product(PRODUCT_ID, SELLER_ID);
        given(productRepository.findById(PRODUCT_ID)).willReturn(Optional.of(product));

        assertThatThrownBy(() -> productOptionService.adjustStock(PRODUCT_ID, OPTION_ID, OTHER_SELLER_ID, 5))
                .isInstanceOf(CustomException.class)
                .extracting(exception -> ((CustomException) exception).getErrorCode())
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    private Product product(Long id, Long sellerId) {
        Product product = Product.builder()
                .seller(seller(sellerId))
                .category(category())
                .name("텀블러")
                .description("보온 텀블러")
                .basePrice(15000)
                .status(ProductStatus.ON_SALE)
                .createdAt(NOW)
                .build();
        ReflectionTestUtils.setField(product, "id", id);
        return product;
    }

    private ProductOption option(Long id, Product product, int stock) {
        ProductOption option = ProductOption.builder()
                .product(product)
                .optionName("기타")
                .optionValue("기본")
                .stock(stock)
                .build();
        ReflectionTestUtils.setField(option, "id", id);
        return option;
    }

    private Category category() {
        Category category = Category.builder().name("생활/리빙").parent(null).build();
        ReflectionTestUtils.setField(category, "id", 10L);
        return category;
    }

    private User seller(Long id) {
        User user = User.builder()
                .email(id + "@test.com")
                .password("encoded")
                .name("판매자")
                .role(UserRole.ROLE_SELLER)
                .createdAt(NOW)
                .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
