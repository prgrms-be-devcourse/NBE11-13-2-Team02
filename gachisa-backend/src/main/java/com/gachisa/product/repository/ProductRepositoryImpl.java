package com.gachisa.product.repository;

import static com.gachisa.product.entity.QProduct.product;

import com.gachisa.product.entity.Product;
import com.gachisa.product.entity.ProductStatus;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ProductRepositoryImpl implements ProductRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Product> search(Long categoryId, Integer minPrice, Integer maxPrice, String keyword) {
        return queryFactory
            .selectFrom(product)
            .where(
                product.status.eq(ProductStatus.ON_SALE),
                categoryEq(categoryId),
                priceGoe(minPrice),
                priceLoe(maxPrice),
                keywordContains(keyword)
            )
            .fetch();
    }

    private BooleanExpression categoryEq(Long categoryId) {
        return categoryId != null ? product.category.id.eq(categoryId) : null;
    }

    private BooleanExpression priceGoe(Integer minPrice) {
        return minPrice != null ? product.basePrice.goe(minPrice) : null;
    }

    private BooleanExpression priceLoe(Integer maxPrice) {
        return maxPrice != null ? product.basePrice.loe(maxPrice) : null;
    }

    private BooleanExpression keywordContains(String keyword) {
        return (keyword != null && !keyword.isBlank()) ? product.name.containsIgnoreCase(keyword) : null;
    }
}
