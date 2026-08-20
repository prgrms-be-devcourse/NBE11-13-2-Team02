package com.gachisa.product.entity;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_option")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "option_name", nullable = false)
    private String optionName;

    @Column(name = "option_value", nullable = false)
    private String optionValue;

    @Column(nullable = false)
    private int stock;

    @Builder
    private ProductOption(Product product, String optionName, String optionValue, int stock) {
        this.product = product;
        this.optionName = optionName;
        this.optionValue = optionValue;
        this.stock = stock;
    }

    public void increaseStock(int quantity) {
        this.stock += quantity;
    }

    public void decreaseStock(int quantity) {
        if (this.stock < quantity) {
            throw new CustomException(ErrorCode.INSUFFICIENT_STOCK);
        }
        this.stock -= quantity;
    }
}
