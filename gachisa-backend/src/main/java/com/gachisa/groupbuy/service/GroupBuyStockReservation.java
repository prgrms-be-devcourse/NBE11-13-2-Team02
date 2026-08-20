package com.gachisa.groupbuy.service;

import com.gachisa.groupbuy.entity.GroupBuy;

public interface GroupBuyStockReservation {

    boolean tryReserve(GroupBuy groupBuy, int quantity);

    void release(Long groupBuyId, int quantity);

    Long getReservedCount(Long groupBuyId);
}
