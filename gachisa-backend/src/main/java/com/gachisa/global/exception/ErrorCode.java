package com.gachisa.global.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Common
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),

    // GroupBuy
    GROUP_BUY_NOT_FOUND(HttpStatus.NOT_FOUND, "공동구매를 찾을 수 없습니다."),
    GROUP_BUY_FULL(HttpStatus.CONFLICT, "정원이 마감되었습니다."),
    GROUP_BUY_CLOSED(HttpStatus.CONFLICT, "이미 마감되었거나 모집중이 아닌 공동구매입니다."),
    GROUP_BUY_INVALID_PERIOD(HttpStatus.BAD_REQUEST, "마감시각은 모집시작시각 이후여야 합니다."),
    GROUP_BUY_CANNOT_CANCEL(HttpStatus.CONFLICT, "이미 마감/정산된 공동구매는 취소할 수 없습니다."),
    INVALID_STATUS_TRANSITION(HttpStatus.CONFLICT, "허용되지 않는 상태 전이입니다."),

    // Participation
    PARTICIPATION_NOT_FOUND(HttpStatus.NOT_FOUND, "참여 내역을 찾을 수 없습니다."),
    PARTICIPATION_NOT_CANCELABLE(HttpStatus.CONFLICT, "참여중 상태에서만 취소할 수 있습니다. 확정 이후에는 환불을 이용하세요."),
    INVALID_QUANTITY(HttpStatus.BAD_REQUEST, "참여 수량은 1 이상이어야 합니다."),

    // Product
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다."),
    PRODUCT_OPTION_NOT_FOUND(HttpStatus.NOT_FOUND, "상품 옵션을 찾을 수 없습니다.");

    private final HttpStatus status;
    private final String message;
}
