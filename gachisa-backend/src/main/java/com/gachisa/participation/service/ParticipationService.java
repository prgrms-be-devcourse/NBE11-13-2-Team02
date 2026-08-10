package com.gachisa.participation.service;

// TODO: 참여 신청 (PT-01) - 핵심 동시성 로직
//
// @Transactional
// public ParticipationResponse participate(Long groupBuyId, Long userId, int quantity) {
//     GroupBuy groupBuy = groupBuyRepository.findByIdForUpdate(groupBuyId)  // 비관적 락
//         .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));
//
//     if (groupBuy.getCurrentCount() + quantity > groupBuy.getTargetCount()) {
//         throw new CustomException(ErrorCode.GROUP_BUY_FULL);
//     }
//
//     groupBuy.increaseCount(quantity);
//     Participation participation = Participation.of(groupBuy, userId, quantity);
//     participationRepository.save(participation);
//     // payment.status <-> participation.status 강한 동기화: 같은 트랜잭션에서 결제 상태도 함께 처리
//     return ParticipationResponse.from(participation);
// }
//
// 참여 취소 (PT-02): status="참여중"일 때만 가능, currentCount 원자적 감소
// 참여 이력 조회 (PT-04)
public class ParticipationService {
}
