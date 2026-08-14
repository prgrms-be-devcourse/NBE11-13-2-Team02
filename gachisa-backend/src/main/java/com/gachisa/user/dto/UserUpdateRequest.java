package com.gachisa.user.dto;

public record UserUpdateRequest(
    String name,
    String currentPassword,
    String newPassword
) {}
