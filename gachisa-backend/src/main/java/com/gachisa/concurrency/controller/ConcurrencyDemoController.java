package com.gachisa.concurrency.controller;

import com.gachisa.concurrency.dto.ConcurrencyStressRequest;
import com.gachisa.concurrency.dto.ConcurrencyStressResponse;
import com.gachisa.concurrency.dto.GroupBuyListItem;
import com.gachisa.concurrency.service.ConcurrencyDemoService;
import com.gachisa.global.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * local 프로필에서만 활성화되는 동시성 검증 API.
 * 프론트 데모 페이지(/dev/concurrency)에서 호출한다.
 */
@RestController
@Profile("local")
@RequiredArgsConstructor
public class ConcurrencyDemoController {

    private final ConcurrencyDemoService concurrencyDemoService;

    /** 데모 페이지에서 groupBuyId를 드롭다운으로 고를 수 있도록 DB에 있는 목록을 내려준다. */
    @GetMapping("/api/dev/group-buys")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    public ApiResponse<List<GroupBuyListItem>> list() {
        List<GroupBuyListItem> items = concurrencyDemoService.listGroupBuys();
        return ApiResponse.ok("공동구매 목록 조회 성공", items);
    }

    @PostMapping("/api/dev/group-buys/{groupBuyId}/concurrency-stress")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    public ApiResponse<ConcurrencyStressResponse> stress(
        @PathVariable Long groupBuyId,
        @Valid @RequestBody ConcurrencyStressRequest request
    ) {
        ConcurrencyStressResponse response = concurrencyDemoService.run(groupBuyId, request);
        return ApiResponse.ok(response.getSummary(), response);
    }
}
