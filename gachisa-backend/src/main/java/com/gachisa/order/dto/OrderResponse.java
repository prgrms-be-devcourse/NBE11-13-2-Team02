package com.gachisa.order.dto;

import com.gachisa.order.entity.DeliveryStatus;
import com.gachisa.order.entity.Order;
import java.time.LocalDateTime;

public record OrderResponse(
        Long orderId,
        Long participationId,
        Long paymentId,
        DeliveryStatus deliveryStatus,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static OrderResponse from(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getParticipationId(),
                order.getPaymentId(),
                order.getDeliveryStatus(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
