package com.gachisa.auth.dto;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.user.entity.UserRole;

public record SignUpRequest(
    String email,
    String password,
    String name,
    UserRole role
) {
    public SignUpRequest {
        if (role != UserRole.ROLE_BUYER && role != UserRole.ROLE_SELLER) {
            throw new CustomException(ErrorCode.INVALID_SIGNUP_ROLE);
        }
    }
}
