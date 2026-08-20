package com.gachisa.payment.service;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.participation.dto.ParticipationPaymentInfo;
import com.gachisa.participation.service.ParticipationService;
import com.gachisa.order.service.OrderService;
import com.gachisa.payment.dto.GroupBuyResultCommand;
import com.gachisa.payment.dto.GroupBuyResultProcessingResponse;
import com.gachisa.payment.entity.Payment;
import com.gachisa.payment.entity.PaymentStatus;
import com.gachisa.payment.dto.RefundResponse;
import com.gachisa.payment.entity.RefundStatus;
import com.gachisa.payment.repository.PaymentRepository;
import java.util.List;
import java.util.HashSet;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GroupBuyResultProcessingService {

    private static final String TARGET_NOT_ACHIEVED_REASON = "공동구매 목표 인원 미달";

    private final PaymentRepository paymentRepository;
    private final RefundService refundService;
    private final ParticipationService participationService;
    private final OrderService orderService;

    public GroupBuyResultProcessingResponse process(GroupBuyResultCommand command) {
        validateParticipations(command);
        List<Payment> payments = paymentRepository.findAllByParticipationIdInAndStatus(
                command.participationIds(), PaymentStatus.PAID);
        if (command.result() == GroupBuyResultCommand.Result.ACHIEVED) {
            orderService.startPreparationForGroupBuy(command.groupBuyId());
            return new GroupBuyResultProcessingResponse(command.groupBuyId(), payments.size(), 0, 0, 0);
        }

        int pendingCount = 0;
        int refundedCount = 0;
        int failedCount = 0;
        for (Payment payment : payments) {
            try {
                RefundResponse refund = refundService.requestRefund(payment.getId(), TARGET_NOT_ACHIEVED_REASON);
                if (refund.status() == RefundStatus.REFUNDED) {
                    refundedCount++;
                } else if (refund.status() == RefundStatus.REFUND_PENDING
                        || refund.status() == RefundStatus.PROCESSING) {
                    pendingCount++;
                } else {
                    failedCount++;
                }
            } catch (CustomException exception) {
                failedCount++;
            }
        }

        return new GroupBuyResultProcessingResponse(
                command.groupBuyId(),
                payments.size(),
                pendingCount,
                refundedCount,
                failedCount
        );
    }

    private void validateParticipations(GroupBuyResultCommand command) {
        if (new HashSet<>(command.participationIds()).size() != command.participationIds().size()) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        for (Long participationId : command.participationIds()) {
            ParticipationPaymentInfo participation = participationService.getPaymentInfo(participationId);
            if (!command.groupBuyId().equals(participation.groupBuyId())) {
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }
        }
    }
}
