package com.gachisa.payment.dto;

import com.gachisa.payment.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;

public record PaymentRequest(
        @NotNull PaymentMethod paymentMethod
) {
}
