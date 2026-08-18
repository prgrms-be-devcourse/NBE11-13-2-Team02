package com.gachisa.order.dto;

import com.gachisa.order.entity.DeliveryStatus;
import jakarta.validation.constraints.NotNull;

public record DeliveryStatusUpdateRequest(
        @NotNull DeliveryStatus deliveryStatus
) {
}
