package com.gachisa.groupbuy.dto;

import com.gachisa.groupbuy.entity.GroupBuy;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
public class GroupBuyResponse {

    private final Long groupBuyId;
    private final String productName;
    private final BigDecimal discountRate;
    private final Integer currentCount;
    private final Integer targetCount;
    private final LocalDateTime deadline;
    private final String status;

    private GroupBuyResponse(GroupBuy g) {
        this.groupBuyId = g.getId();
        this.productName = g.getProduct().getName();
        this.discountRate = g.getDiscountRate();
        this.currentCount = g.getCurrentCount();
        this.targetCount = g.getTargetCount();
        this.deadline = g.getDeadline();
        this.status = g.getStatus().getLabel();
    }

    public static GroupBuyResponse from(GroupBuy groupBuy) {
        return new GroupBuyResponse(groupBuy);
    }
}
