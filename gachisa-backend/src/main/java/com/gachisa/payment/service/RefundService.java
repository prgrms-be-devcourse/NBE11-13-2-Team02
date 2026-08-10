package com.gachisa.payment.service;

// TODO: 참여 확정 후 환불 처리 (PAY-04)
// order.deliveryStatus 확인 후 분기:
//   배송준비 -> 즉시 취소 + 전액 환불
//   배송중/배송완료 -> 반품중 -> 반품완료 -> 환불
public class RefundService {
}
