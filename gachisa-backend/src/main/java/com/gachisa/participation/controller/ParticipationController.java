package com.gachisa.participation.controller;

import com.gachisa.global.response.ApiResponse;
import com.gachisa.global.security.CustomUserDetails;
import com.gachisa.participation.dto.ParticipationCountResponse;
import com.gachisa.participation.dto.ParticipationCreateRequest;
import com.gachisa.participation.dto.ParticipationResponse;
import com.gachisa.participation.entity.ParticipationStatus;
import com.gachisa.participation.service.ParticipationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ParticipationController {

    private final ParticipationService participationService;

    /** PT-01 */
    @PostMapping("/api/group-buys/{groupBuyId}/participations")
    public ResponseEntity<ApiResponse<ParticipationResponse>> participate(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long groupBuyId,
            @Valid @RequestBody ParticipationCreateRequest request
    ) {
        ParticipationResponse response =
                participationService.participate(groupBuyId, userDetails.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("공동구매 참여가 완료되었습니다.", response));
    }

    /** PT-02 */
    @DeleteMapping("/api/participations/{participationId}")
    public ApiResponse<ParticipationResponse> cancel(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long participationId
    ) {
        ParticipationResponse response =
                participationService.cancel(participationId, userDetails.getUserId());
        return ApiResponse.ok("참여가 취소되었습니다.", response);
    }

    /** PT-03. 인증 불필요, 프론트에서 폴링용으로 자주 호출 */
    @GetMapping("/api/group-buys/{groupBuyId}/participation-count")
    public ApiResponse<ParticipationCountResponse> count(@PathVariable Long groupBuyId) {
        ParticipationCountResponse response = participationService.getParticipationCount(groupBuyId);
        return ApiResponse.ok("참여 인원을 조회했습니다.", response);
    }

    /** PT-04 */
    @GetMapping("/api/users/me/participations")
    public ApiResponse<Page<ParticipationResponse>> myParticipations(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) ParticipationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ParticipationResponse> response =
                participationService.getMyParticipations(userDetails.getUserId(), status, pageable);
        return ApiResponse.ok("참여 이력을 조회했습니다.", response);
    }
}
