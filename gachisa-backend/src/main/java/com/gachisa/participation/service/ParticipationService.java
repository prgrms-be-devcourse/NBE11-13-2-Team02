package com.gachisa.participation.service;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.groupbuy.entity.GroupBuy;
import com.gachisa.groupbuy.service.GroupBuyStockReservation;
import com.gachisa.groupbuy.service.GroupBuyService;
import com.gachisa.participation.dto.ParticipationCountResponse;
import com.gachisa.participation.dto.ParticipationCreateRequest;
import com.gachisa.participation.dto.ParticipationResponse;
import com.gachisa.participation.dto.ParticipationPaymentInfo;
import com.gachisa.participation.entity.Participation;
import com.gachisa.participation.entity.ParticipationStatus;
import com.gachisa.participation.repository.ParticipationRepository;
import com.gachisa.user.entity.User;
import com.gachisa.user.repository.UserRepository;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
public class ParticipationService {

    private final ParticipationRepository participationRepository;
    private final GroupBuyService groupBuyService;
    private final GroupBuyStockReservation groupBuyStockReservation;
    private final UserRepository userRepository;
    // TODO(결제 담당자): PaymentService 주입 후 participate() 안에서 결제 요청까지
    // 같은 트랜잭션으로 묶어 payment.status <-> participation.status 강한 동기화

    /**
     * PT-01. 공동구매 참여
     *
     * 동시성 제어: Redis Lua 스크립트로 정원 초과 요청을 먼저 원자적으로 차단하고,
     * GroupBuyService.reserveSlots()가 비관적 락으로 group_buy row를 다시 확인한다.
     *
     * 정원 초과 시 GroupBuy.reserve()에서 CustomException(GROUP_BUY_FULL)을 던지고,
     * 트랜잭션이 롤백되어 currentCount 증가도 취소된다.
     */
    @Transactional
    public ParticipationResponse participate(Long groupBuyId, Long userId, ParticipationCreateRequest request) {
        if (request.getQuantity() == null || request.getQuantity() < 1) {
            throw new CustomException(ErrorCode.INVALID_QUANTITY);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.FORBIDDEN));

        GroupBuy snapshot = groupBuyService.getGroupBuyEntityOrThrow(groupBuyId);
        if (!groupBuyStockReservation.tryReserve(snapshot, request.getQuantity())) {
            throw new CustomException(ErrorCode.GROUP_BUY_FULL);
        }
        Runnable releaseReservation = releaseRedisReservationOnRollback(groupBuyId, request.getQuantity());

        try {
            GroupBuy groupBuy = groupBuyService.reserveSlots(groupBuyId, request.getQuantity());

            Participation participation = Participation.builder()
                    .groupBuy(groupBuy)
                    .user(user)
                    .quantity(request.getQuantity())
                    .build();
            participationRepository.save(participation);

            // TODO(결제 연동): paymentService.requestPayment(participation) 호출 후
            // 결제 성공 시 participation.confirm() 을 같은 트랜잭션에서 호출 (강한 동기화)

            return ParticipationResponse.from(participation);
        } catch (RuntimeException e) {
            releaseReservation.run();
            throw e;
        }
    }

    /**
     * PT-02. 참여 취소
     * "참여중" 상태에서만 가능. 확정 이후는 결제 담당 모듈의 환불 API를 사용해야 한다.
     */
    @Transactional
    public ParticipationResponse cancel(Long participationId, Long userId) {
        Participation participation = participationRepository.findByIdAndUser_Id(participationId, userId)
                .orElseThrow(() -> new CustomException(ErrorCode.PARTICIPATION_NOT_FOUND));

        if (!participation.isCancelable()) {
            throw new CustomException(ErrorCode.PARTICIPATION_NOT_CANCELABLE);
        }

        participation.cancel();

        groupBuyService.releaseSlots(participation.getGroupBuy().getId(), participation.getQuantity());
        releaseRedisReservationAfterCommit(participation.getGroupBuy().getId(), participation.getQuantity());

        return ParticipationResponse.from(participation);
    }

    /** PT-03. 실시간 참여 인원 조회 */
    @Transactional(readOnly = true)
    public ParticipationCountResponse getParticipationCount(Long groupBuyId) {
        GroupBuy groupBuy = groupBuyService.getGroupBuyEntityOrThrow(groupBuyId);
        Long redisCount = groupBuyStockReservation.getReservedCount(groupBuyId);
        int currentCount = redisCount == null ? groupBuy.getCurrentCount() : Math.toIntExact(redisCount);
        return new ParticipationCountResponse(currentCount, groupBuy.getTargetCount());
    }

    /** PT-04. 참여 이력 조회 */
    @Transactional(readOnly = true)
    public Page<ParticipationResponse> getMyParticipations(Long userId, ParticipationStatus status, Pageable pageable) {
        Page<Participation> page = (status != null)
                ? participationRepository.findByUser_IdAndStatus(userId, status, pageable)
                : participationRepository.findByUser_Id(userId, pageable);

        return page.map(ParticipationResponse::from);
    }

    @Transactional(readOnly = true)
    public ParticipationPaymentInfo getPaymentInfo(Long participationId) {
        Participation participation = participationRepository.findPaymentInfoById(participationId)
                .orElseThrow(() -> new CustomException(ErrorCode.PARTICIPATION_NOT_FOUND));
        return new ParticipationPaymentInfo(
                participation.getId(),
                participation.getUser().getId(),
                participation.getGroupBuy().getId(),
                participation.getQuantity(),
                participation.getStatus() == ParticipationStatus.PARTICIPATING
        );
    }

    @Transactional
    public void confirmPayment(Long participationId) {
        Participation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new CustomException(ErrorCode.PARTICIPATION_NOT_FOUND));
        if (participation.getStatus() == ParticipationStatus.CONFIRMED) {
            return;
        }
        if (participation.getStatus() != ParticipationStatus.PARTICIPATING) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        participation.confirm();
    }

    @Transactional
    public void refundPayment(Long participationId) {
        Participation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new CustomException(ErrorCode.PARTICIPATION_NOT_FOUND));
        if (participation.getStatus() == ParticipationStatus.REFUNDED) {
            return;
        }
        if (participation.getStatus() != ParticipationStatus.CONFIRMED) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        participation.refund();
    }

    private Runnable releaseRedisReservationOnRollback(Long groupBuyId, int quantity) {
        AtomicBoolean released = new AtomicBoolean(false);
        Runnable release = () -> {
            if (released.compareAndSet(false, true)) {
                groupBuyStockReservation.release(groupBuyId, quantity);
            }
        };

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status != TransactionSynchronization.STATUS_COMMITTED) {
                        release.run();
                    }
                }
            });
        }
        return release;
    }

    private void releaseRedisReservationAfterCommit(Long groupBuyId, int quantity) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            groupBuyStockReservation.release(groupBuyId, quantity);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                groupBuyStockReservation.release(groupBuyId, quantity);
            }
        });
    }
}
