package com.gachisa.groupbuy.service;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.groupbuy.dto.GroupBuyCreateRequest;
import com.gachisa.groupbuy.dto.GroupBuyDetailResponse;
import com.gachisa.groupbuy.dto.GroupBuyPaymentInfo;
import com.gachisa.groupbuy.dto.GroupBuyQueueInfo;
import com.gachisa.groupbuy.dto.GroupBuyResponse;
import com.gachisa.groupbuy.entity.GroupBuy;
import com.gachisa.groupbuy.entity.GroupBuyStatus;
import com.gachisa.groupbuy.repository.GroupBuyRepository;
import com.gachisa.product.entity.Product;
import com.gachisa.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GroupBuyService {

    private final GroupBuyRepository groupBuyRepository;
    private final ProductRepository productRepository;

    /** GB-01 */
    @Transactional
    public GroupBuyResponse createGroupBuy(Long sellerId, GroupBuyCreateRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new CustomException(ErrorCode.PRODUCT_NOT_FOUND));

        GroupBuy groupBuy = GroupBuy.builder()
                .product(product)
                .targetCount(request.getTargetCount())
                .discountRate(request.getDiscountRate())
                .openAt(request.getOpenAt())
                .deadline(request.getDeadline())
                .sellerId(sellerId)
                .build();

        groupBuyRepository.save(groupBuy);
        return GroupBuyResponse.from(groupBuy);
    }

    /** GB-02 */
    @Transactional(readOnly = true)
    public Page<GroupBuyResponse> getGroupBuyList(GroupBuyStatus status, Pageable pageable) {
        GroupBuyStatus target = (status != null) ? status : GroupBuyStatus.RECRUITING;
        return groupBuyRepository.findByStatus(target, pageable)
                .map(GroupBuyResponse::from);
    }

    /** GB-03 */
    @Transactional(readOnly = true)
    public GroupBuyDetailResponse getGroupBuyDetail(Long groupBuyId) {
        GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));

        long remainingSeconds = Math.max(0,
                Duration.between(LocalDateTime.now(), groupBuy.getDeadline()).getSeconds());

        return GroupBuyDetailResponse.of(groupBuy, remainingSeconds);
    }

    /** GB-05: 판매자가 마감 전 취소 */
    @Transactional
    public GroupBuyResponse cancelGroupBuy(Long sellerId, Long groupBuyId) {
        GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));

        if (!groupBuy.isOwnedBy(sellerId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
        groupBuy.cancelBySeller();
        return GroupBuyResponse.from(groupBuy);
    }

    /**
     * 참여(Participation) 도메인에서 호출하는 핵심 메서드.
     * 비관적 락으로 group_buy row를 잠근 뒤 인원을 예약한다.
     * @Transactional(REQUIRED, 기본값) 이므로 호출자(ParticipationService)의
     * 트랜잭션에 참여하여 같은 트랜잭션 범위 안에서 락이 유지된다.
     */
    @Transactional
    public GroupBuy reserveSlots(Long groupBuyId, int quantity) {
        GroupBuy groupBuy = groupBuyRepository.findByIdForUpdate(groupBuyId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));
        groupBuy.reserve(quantity);
        return groupBuy;
    }

    /** 참여 취소 시 인원 롤백 (역시 락 하에서 처리) */
    @Transactional
    public void releaseSlots(Long groupBuyId, int quantity) {
        GroupBuy groupBuy = groupBuyRepository.findByIdForUpdate(groupBuyId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));
        groupBuy.release(quantity);
    }

    /** 참여 도메인(PT-03 등)이 락 없이 가볍게 엔티티를 조회할 때 사용 */
    @Transactional(readOnly = true)
    public GroupBuy getGroupBuyEntityOrThrow(Long groupBuyId) {
        return groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public GroupBuyPaymentInfo getPaymentInfo(Long groupBuyId) {
        GroupBuy groupBuy = getGroupBuyEntityOrThrow(groupBuyId);
        return new GroupBuyPaymentInfo(
                groupBuy.getId(),
                groupBuy.getProduct().getId(),
                groupBuy.getDiscountRate()
        );
    }

    @Transactional(readOnly = true)
    public GroupBuyQueueInfo getQueueInfo(Long groupBuyId) {
        GroupBuy groupBuy = getGroupBuyEntityOrThrow(groupBuyId);
        return new GroupBuyQueueInfo(
                groupBuy.getId(),
                groupBuy.getTargetCount(),
                groupBuy.getCurrentCount(),
                groupBuy.getOpenAt(),
                groupBuy.getDeadline(),
                groupBuy.getStatus()
        );
    }
}
