package com.gachisa.queue.controller;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.queue.dto.QueueStatusResponse;
import com.gachisa.queue.dto.QueueTokenResponse;
import com.gachisa.queue.service.QueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/group-buys/{groupBuyId}/queue-token")
@RequiredArgsConstructor
public class QueueController {

    private final QueueService queueService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QueueTokenResponse issueToken(
            @PathVariable Long groupBuyId,
            @AuthenticationPrincipal(expression = "userId") Long userId
    ) {
        return queueService.issueToken(groupBuyId, requireUserId(userId));
    }

    @GetMapping("/{queueToken}/status")
    public QueueStatusResponse getStatus(
            @PathVariable Long groupBuyId,
            @PathVariable String queueToken,
            @AuthenticationPrincipal(expression = "userId") Long userId
    ) {
        return queueService.getStatus(groupBuyId, requireUserId(userId), queueToken);
    }

    private Long requireUserId(Long userId) {
        if (userId == null) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
        return userId;
    }
}
