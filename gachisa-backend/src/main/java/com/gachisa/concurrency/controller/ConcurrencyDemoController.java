package com.gachisa.concurrency.controller;

import com.gachisa.concurrency.dto.ConcurrencyStressRequest;
import com.gachisa.concurrency.dto.ConcurrencyStressResponse;
import com.gachisa.concurrency.service.ConcurrencyDemoService;
import com.gachisa.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.security.access.prepost.PreAuthorize;
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
