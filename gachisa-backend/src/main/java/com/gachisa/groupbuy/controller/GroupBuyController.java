package com.gachisa.groupbuy.controller;

import com.gachisa.global.response.ApiResponse;
import com.gachisa.global.security.CustomUserDetails;
import com.gachisa.groupbuy.dto.GroupBuyCreateRequest;
import com.gachisa.groupbuy.dto.GroupBuyDetailResponse;
import com.gachisa.groupbuy.dto.GroupBuyResponse;
import com.gachisa.groupbuy.entity.GroupBuyStatus;
import com.gachisa.groupbuy.service.GroupBuyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/group-buys")
@RequiredArgsConstructor
public class GroupBuyController {

    private final GroupBuyService groupBuyService;

    /** GB-01. 판매자만 생성 가능 */
    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<GroupBuyResponse>> create(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @Valid @RequestBody GroupBuyCreateRequest request
    ) {
        GroupBuyResponse response = groupBuyService.createGroupBuy(userDetails.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.created("공동구매가 생성되었습니다.", response));
    }

    /** GB-02. 인증 불필요 - 필터 없는 기본 목록 */
    @GetMapping
    public ApiResponse<Page<GroupBuyResponse>> list(
        @RequestParam(required = false) GroupBuyStatus status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<GroupBuyResponse> result = groupBuyService.getGroupBuyList(status, pageable);
        return ApiResponse.ok("공동구매 목록을 조회했습니다.", result);
    }

    /**
     * 검색 전용 엔드포인트.
     * 가격 필터/정렬은 할인가(basePrice - basePrice*discountRate) 기준으로 DB에서 직접 계산한다.
     */
    @GetMapping("/search")
    public ApiResponse<Page<GroupBuyResponse>> search(
        @RequestParam(required = false) GroupBuyStatus status,
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) Long categoryId,
        @RequestParam(required = false) Integer minPrice,
        @RequestParam(required = false) Integer maxPrice,
        @RequestParam(required = false) String sort,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<GroupBuyResponse> result = groupBuyService.searchGroupBuy(
            status, keyword, categoryId, minPrice, maxPrice, sort, pageable);
        return ApiResponse.ok("공동구매 검색 결과를 조회했습니다.", result);
    }

    /** GB-03. 인증 불필요 */
    @GetMapping("/{groupBuyId}")
    public ApiResponse<GroupBuyDetailResponse> detail(@PathVariable Long groupBuyId) {
        GroupBuyDetailResponse response = groupBuyService.getGroupBuyDetail(groupBuyId);
        return ApiResponse.ok("공동구매 상세를 조회했습니다.", response);
    }

    /** GB-05. 판매자 본인 소유만 취소 가능 */
    @PatchMapping("/{groupBuyId}/cancel")
    @PreAuthorize("hasRole('SELLER')")
    public ApiResponse<GroupBuyResponse> cancel(
        @AuthenticationPrincipal CustomUserDetails userDetails,
        @PathVariable Long groupBuyId
    ) {
        GroupBuyResponse response = groupBuyService.cancelGroupBuy(userDetails.getUserId(), groupBuyId);
        return ApiResponse.ok("공동구매가 취소되었습니다.", response);
    }
}
