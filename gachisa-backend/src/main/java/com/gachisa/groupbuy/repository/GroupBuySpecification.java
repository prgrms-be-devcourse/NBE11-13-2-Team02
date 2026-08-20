package com.gachisa.groupbuy.repository;

import com.gachisa.groupbuy.entity.GroupBuy;
import com.gachisa.groupbuy.entity.GroupBuyStatus;
import com.gachisa.product.entity.Product;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

public class GroupBuySpecification {

    private GroupBuySpecification() {
    }

    public static Specification<GroupBuy> combine(GroupBuyStatus status, String keyword, Long categoryId,
                                                  Integer minPrice, Integer maxPrice) {
        return statusEq(status)
                .and(keywordContains(keyword))
                .and(categoryEq(categoryId))
                .and(priceGoe(minPrice))
                .and(priceLoe(maxPrice));
    }

    private static Specification<GroupBuy> statusEq(GroupBuyStatus status) {
        return (root, query, cb) -> status != null ? cb.equal(root.get("status"), status) : null;
    }

    private static Specification<GroupBuy> keywordContains(String keyword) {
        return (root, query, cb) -> {
            if (keyword == null || keyword.isBlank()) {
                return null;
            }
            Join<GroupBuy, Product> product = root.join("product");
            return cb.like(cb.lower(product.get("name")), "%" + keyword.toLowerCase() + "%");
        };
    }

    private static Specification<GroupBuy> categoryEq(Long categoryId) {
        return (root, query, cb) -> {
            if (categoryId == null) {
                return null;
            }
            Join<GroupBuy, Product> product = root.join("product");
            return cb.equal(product.get("category").get("id"), categoryId);
        };
    }

    private static Specification<GroupBuy> priceGoe(Integer minPrice) {
        return (root, query, cb) -> {
            if (minPrice == null) {
                return null;
            }
            Join<GroupBuy, Product> product = root.join("product");
            return cb.ge(product.get("basePrice"), minPrice);
        };
    }

    private static Specification<GroupBuy> priceLoe(Integer maxPrice) {
        return (root, query, cb) -> {
            if (maxPrice == null) {
                return null;
            }
            Join<GroupBuy, Product> product = root.join("product");
            return cb.le(product.get("basePrice"), maxPrice);
        };
    }
}
