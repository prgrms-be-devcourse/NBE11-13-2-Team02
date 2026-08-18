package com.gachisa.order.entity;

public enum DeliveryStatus {
    PREPARING,
    SHIPPING,
    DELIVERED;

    public boolean canChangeTo(DeliveryStatus newStatus) {
        return (this == PREPARING && newStatus == SHIPPING)
                || (this == SHIPPING && newStatus == DELIVERED);
    }
}
