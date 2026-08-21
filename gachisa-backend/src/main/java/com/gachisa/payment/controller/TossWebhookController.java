package com.gachisa.payment.controller;

import com.gachisa.payment.dto.TossPaymentWebhookRequest;
import com.gachisa.payment.dto.TossWebhookResponse;
import com.gachisa.payment.service.TossWebhookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks/toss")
@RequiredArgsConstructor
public class TossWebhookController {

    private final TossWebhookService tossWebhookService;

    @PostMapping("/payments")
    public TossWebhookResponse paymentStatusChanged(
            @RequestHeader(value = "tosspayments-webhook-transmission-id", required = false) String transmissionId,
            @Valid @RequestBody TossPaymentWebhookRequest request
    ) {
        return tossWebhookService.process(transmissionId, request);
    }
}
