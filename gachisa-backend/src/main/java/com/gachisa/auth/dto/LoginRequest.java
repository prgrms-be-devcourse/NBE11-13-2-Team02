package com.gachisa.auth.dto;

public record LoginRequest(
    String email,
    String password
) {}
