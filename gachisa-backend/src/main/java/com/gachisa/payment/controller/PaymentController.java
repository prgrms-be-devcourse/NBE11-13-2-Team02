package com.gachisa.payment.controller;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.payment.dto.PaymentConfirmRequest;
import com.gachisa.payment.dto.PaymentRequest;
import com.gachisa.payment.dto.PaymentResponse;
import com.gachisa.payment.service.PaymentService;
import com.gachisa.payment.service.PaymentCancellationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentCancellationService paymentCancellationService;

    @PostMapping("/participations/{participationId}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelParticipation(
            @PathVariable Long participationId,
            @AuthenticationPrincipal(expression = "userId") Long userId) {
        paymentCancellationService.cancel(participationId, requireUserId(userId));
    }

    @PostMapping("/participations/{participationId}/payment")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse createPayment(
            @PathVariable Long participationId,
            @AuthenticationPrincipal(expression = "userId") Long userId,
            @RequestHeader("Idempotency-Key") String clientRequestId,
            @RequestHeader("Queue-Token") String queueToken,
            @Valid @RequestBody PaymentRequest request
    ) {
        return paymentService.createPayment(
                participationId,
                requireUserId(userId),
                clientRequestId,
                queueToken,
                request
        );
    }

    @PostMapping("/payment-attempts/{paymentAttemptId}/confirm")
    public PaymentResponse confirmPayment(
            @PathVariable Long paymentAttemptId,
            @AuthenticationPrincipal(expression = "userId") Long userId,
            @Valid @RequestBody PaymentConfirmRequest request
    ) {
        return paymentService.confirmPayment(paymentAttemptId, requireUserId(userId), request);
    }

    @GetMapping("/payments/{paymentId}")
    public PaymentResponse getPayment(
            @PathVariable Long paymentId,
            @AuthenticationPrincipal(expression = "userId") Long userId
    ) {
        return paymentService.getPayment(paymentId, requireUserId(userId));
    }

    private Long requireUserId(Long userId) {
        if (userId == null) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
        return userId;
    }
}
