package com.gachisa.auth.dto;

import com.gachisa.user.entity.UserRole;

public record AuthenticatedUser(
    Long id,
    String name,
    UserRole role
) {}
