package com.gachisa.global.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    // Common
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없습니다."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),

    // GroupBuy
    GROUP_BUY_NOT_FOUND(HttpStatus.NOT_FOUND, "공동구매를 찾을 수 없습니다."),
    GROUP_BUY_FULL(HttpStatus.CONFLICT, "정원이 마감되었습니다."),
    GROUP_BUY_CLOSED(HttpStatus.CONFLICT, "이미 마감된 공동구매입니다."),
    INVALID_STATUS_TRANSITION(HttpStatus.CONFLICT, "허용되지 않는 상태 전이입니다."),

    // Participation
    PARTICIPATION_NOT_FOUND(HttpStatus.NOT_FOUND, "참여 내역을 찾을 수 없습니다."),
    CANNOT_CANCEL_CONFIRMED(HttpStatus.CONFLICT, "확정된 참여는 취소할 수 없습니다. 환불을 이용하세요."),

    // Product
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "상품을 찾을 수 없습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}
