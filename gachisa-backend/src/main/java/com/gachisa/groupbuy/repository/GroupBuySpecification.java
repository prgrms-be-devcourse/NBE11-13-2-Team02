package com.gachisa.groupbuy.repository;

import com.gachisa.groupbuy.entity.GroupBuy;
import com.gachisa.groupbuy.entity.GroupBuyStatus;
import com.gachisa.product.entity.Product;
import org.springframework.data.jpa.domain.Specification;

public class GroupBuySpecification {

    private GroupBuySpecification() {
    }

    public static Specification<GroupBuy> hasStatus(GroupBuyStatus status) {
        if (status == null) return null;
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<GroupBuy> hasKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) return null;
        return (root, query, cb) -> {
            var productJoin = root.join("product", jakarta.persistence.criteria.JoinType.INNER);
            return cb.like(productJoin.get("name"), "%" + keyword + "%");
        };
    }

    public static Specification<GroupBuy> hasCategory(Long categoryId) {
        if (categoryId == null) return null;
        return (root, query, cb) -> {
            var productJoin = root.join("product", jakarta.persistence.criteria.JoinType.INNER);
            var categoryJoin = productJoin.join("category", jakarta.persistence.criteria.JoinType.INNER);
            return cb.equal(categoryJoin.get("id"), categoryId);
        };
    }

    public static Specification<GroupBuy> priceBetween(Integer minPrice, Integer maxPrice) {
        if (minPrice == null && maxPrice == null) return null;
        return (root, query, cb) -> {
            var productJoin = root.join("product", jakarta.persistence.criteria.JoinType.INNER);
            var priceExpr = productJoin.<Integer>get("basePrice");
            if (minPrice != null && maxPrice != null) {
                return cb.between(priceExpr, minPrice, maxPrice);
            } else if (minPrice != null) {
                return cb.greaterThanOrEqualTo(priceExpr, minPrice);
            } else {
                return cb.lessThanOrEqualTo(priceExpr, maxPrice);
            }
        };
    }

    public static Specification<GroupBuy> combine(GroupBuyStatus status, String keyword,
                                                  Long categoryId, Integer minPrice, Integer maxPrice) {
        return Specification.where(hasStatus(status))
            .and(hasKeyword(keyword))
            .and(hasCategory(categoryId))
            .and(priceBetween(minPrice, maxPrice));
    }
}
