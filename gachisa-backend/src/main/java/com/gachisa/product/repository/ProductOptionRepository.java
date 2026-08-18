package com.gachisa.product.repository;

import com.gachisa.product.entity.ProductOption;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductOptionRepository extends JpaRepository<ProductOption, Long> {
    List<ProductOption> findByProductId(Long productId);
}
