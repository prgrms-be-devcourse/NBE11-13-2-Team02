package com.gachisa.payment.dto;

public record GroupBuyResultProcessingResponse(
        Long groupBuyId,
        int targetPaymentCount,
        int pendingCount,
        int refundedCount,
        int failedCount
) {
}
