package com.gachisa.payment.service;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.participation.dto.ParticipationPaymentInfo;
import com.gachisa.participation.service.ParticipationService;
import com.gachisa.payment.entity.Payment;
import com.gachisa.payment.entity.PaymentStatus;
import com.gachisa.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PaymentCancellationService {

    private static final String USER_CANCELLATION_REASON = "구매자 공동구매 참여 취소";

    private final PaymentRepository paymentRepository;
    private final ParticipationService participationService;
    private final RefundService refundService;

    public void cancel(Long participationId, Long userId) {
        ParticipationPaymentInfo participation = participationService.getPaymentInfo(participationId);
        if (!participation.userId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        Payment payment = paymentRepository.findByParticipationId(participationId).orElse(null);
        if (payment == null || payment.getStatus() == PaymentStatus.READY) {
            participationService.cancel(participationId, userId);
            return;
        }
        if (payment.getStatus() == PaymentStatus.PAID) {
            refundService.requestRefund(payment.getId(), USER_CANCELLATION_REASON);
        }
    }
}
