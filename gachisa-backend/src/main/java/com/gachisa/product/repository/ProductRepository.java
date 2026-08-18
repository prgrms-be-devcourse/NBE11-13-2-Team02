package com.gachisa.product.repository;

import com.gachisa.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

// TODO(상품 담당자): findByStatus, findBySellerId 등 필요한 조회 메서드 추가
public interface ProductRepository extends JpaRepository<Product, Long>, ProductRepositoryCustom {
}
