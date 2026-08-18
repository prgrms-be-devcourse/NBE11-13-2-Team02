package com.gachisa.payment.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TossPaymentWebhookRequest(
        @NotBlank String eventType,
        @NotBlank String createdAt,
        @Valid @NotNull PaymentData data
) {

    public record PaymentData(
            @NotBlank String paymentKey,
            @NotBlank String orderId,
            @NotBlank String status
    ) {
    }
}
