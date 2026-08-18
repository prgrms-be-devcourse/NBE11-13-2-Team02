package com.gachisa.groupbuy.service;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.groupbuy.dto.GroupBuyPaymentInfo;
import com.gachisa.groupbuy.dto.GroupBuyQueueInfo;
import com.gachisa.groupbuy.entity.GroupBuy;
import com.gachisa.groupbuy.repository.GroupBuyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GroupBuyService {

    private final GroupBuyRepository groupBuyRepository;

    @Transactional(readOnly = true)
    public GroupBuyPaymentInfo getPaymentInfo(Long groupBuyId) {
        GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));

        return new GroupBuyPaymentInfo(
                groupBuy.getId(),
                groupBuy.getProduct().getId(),
                groupBuy.getDiscountRate()
        );
    }

    @Transactional(readOnly = true)
    public GroupBuyQueueInfo getQueueInfo(Long groupBuyId) {
        GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));

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
