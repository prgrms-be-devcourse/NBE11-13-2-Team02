package com.gachisa.global.response;

import com.gachisa.global.exception.ErrorCode;
import java.time.LocalDateTime;

public record ErrorResponse(
    int status,
    String error,
    LocalDateTime timestamp
) {
    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(errorCode.getStatus().value(), errorCode.getMessage(), LocalDateTime.now());
    }

    public static ErrorResponse of(ErrorCode errorCode, String message) {
        return new ErrorResponse(errorCode.getStatus().value(), message, LocalDateTime.now());
    }
}
