package com.gachisa.payment.dto;

import com.gachisa.payment.entity.Payment;
import com.gachisa.payment.entity.PaymentAttempt;
import com.gachisa.payment.entity.PaymentAttemptStatus;
import com.gachisa.payment.entity.PaymentMethod;
import com.gachisa.payment.entity.PaymentStatus;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long paymentId,
        Long paymentAttemptId,
        Long participationId,
        String pgOrderId,
        String pgPaymentKey,
        int amount,
        PaymentStatus paymentStatus,
        PaymentAttemptStatus attemptStatus,
        PaymentMethod paymentMethod,
        int retryCount,
        LocalDateTime nextRetryAt,
        String failureCode,
        String failureMessage,
        LocalDateTime expiresAt,
        LocalDateTime paidAt,
        LocalDateTime refundedAt,
        LocalDateTime createdAt
) {

    public static PaymentResponse from(Payment payment, PaymentAttempt attempt) {
        return new PaymentResponse(
                payment.getId(),
                attempt == null ? null : attempt.getId(),
                payment.getParticipationId(),
                attempt == null ? null : attempt.getPgOrderId(),
                attempt == null ? null : attempt.getPgPaymentKey(),
                payment.getAmount(),
                payment.getStatus(),
                attempt == null ? null : attempt.getStatus(),
                attempt == null ? null : attempt.getPaymentMethod(),
                attempt == null ? 0 : attempt.getRetryCount(),
                attempt == null ? null : attempt.getNextRetryAt(),
                attempt == null ? null : attempt.getFailureCode(),
                attempt == null ? null : attempt.getFailureMessage(),
                attempt == null ? null : attempt.getExpiresAt(),
                payment.getPaidAt(),
                payment.getRefundedAt(),
                payment.getCreatedAt()
        );
    }
}
