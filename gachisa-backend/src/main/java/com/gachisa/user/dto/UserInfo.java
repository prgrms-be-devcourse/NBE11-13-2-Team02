package com.gachisa.user.dto;

import com.gachisa.user.entity.UserRole;

public record UserInfo(
    Long id,
    String email,
    String name,
    UserRole role
) {}
