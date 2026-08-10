package com.gachisa.groupbuy.service;

// TODO: @Scheduled(fixedDelay = ...)
// 마감 시각이 지난 GroupBuy를 조회하여 목표 달성/미달 판정 후
// GroupBuyService, ParticipationService, PaymentService를 순서대로 호출해
// 상태를 확정/환불로 전이 (GB-04, PAY-02, PAY-03)
// 별도 settlement_batch 테이블 없이 group_buy/participation/payment를 직접 갱신
public class GroupBuySettlementScheduler {
}
