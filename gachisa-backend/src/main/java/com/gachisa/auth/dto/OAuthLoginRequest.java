package com.gachisa.auth.dto;

public record OAuthLoginRequest(
    String code,
    String redirectUri,
    String state
) {}
