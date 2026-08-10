package com.gachisa.groupbuy.entity;

import com.gachisa.product.entity.Product;
import com.gachisa.product.entity.ProductOption;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "group_buy")
public class GroupBuy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_option_id", nullable = false)
    private ProductOption productOption;

    @Column(nullable = false)
    private int targetCount;

    @Column(nullable = false)
    private int currentCount;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal discountRate;

    @Column(nullable = false)
    private LocalDateTime openAt;

    @Column(nullable = false)
    private LocalDateTime deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GroupBuyStatus status;

    @Builder
    private GroupBuy(Product product, ProductOption productOption, int targetCount, int currentCount,
                      BigDecimal discountRate, LocalDateTime openAt, LocalDateTime deadline, GroupBuyStatus status) {
        this.product = product;
        this.productOption = productOption;
        this.targetCount = targetCount;
        this.currentCount = currentCount;
        this.discountRate = discountRate;
        this.openAt = openAt;
        this.deadline = deadline;
        this.status = status;
    }

    public void increaseCurrentCount(int quantity) {
        this.currentCount += quantity;
    }

    public void decreaseCurrentCount(int quantity) {
        this.currentCount -= quantity;
    }

    public void changeStatus(GroupBuyStatus status) {
        this.status = status;
    }
}
