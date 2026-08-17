package com.gachisa.product.repository;

import com.gachisa.product.entity.Product;
import java.util.List;

public interface ProductRepositoryCustom {

    List<Product> search(Long categoryId, Integer minPrice, Integer maxPrice, String keyword);
}
