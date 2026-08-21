package com.gachisa.auth.controller;

import com.gachisa.auth.dto.*;
import com.gachisa.auth.service.AuthService;
import com.gachisa.user.dto.UserInfo;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "sid";

    private final AuthService authService;

    @PostMapping("/signup")
    public SignUpResponse signup(@RequestBody SignUpRequest request) {
        UserInfo userInfo = authService.signUp(request.email(), request.password(), request.name(), request.role());
        return new SignUpResponse(userInfo.id(), userInfo.email(), userInfo.name(), userInfo.role().name());
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request, HttpServletResponse response) {
        LoginResult result = authService.login(request.email(), request.password());
        setRefreshCookie(response, result.rawRefreshToken());
        return new LoginResponse(result.accessToken(), result.tokenType(), result.expiresIn());
    }

    @PostMapping("/oauth/kakao")
    public LoginResponse loginWithKakao(@RequestBody OAuthLoginRequest request, HttpServletResponse response) {
        LoginResult result = authService.loginWithKakao(request.code(), request.redirectUri());
        setRefreshCookie(response, result.rawRefreshToken());
        return new LoginResponse(result.accessToken(), result.tokenType(), result.expiresIn());
    }

    @PostMapping("/oauth/naver")
    public LoginResponse loginWithNaver(@RequestBody OAuthLoginRequest request, HttpServletResponse response) {
        LoginResult result = authService.loginWithNaver(request.code(), request.redirectUri(), request.state());
        setRefreshCookie(response, result.rawRefreshToken());
        return new LoginResponse(result.accessToken(), result.tokenType(), result.expiresIn());
    }

    @PostMapping("/reissue")
    public ReissueResponse reissue(@CookieValue(REFRESH_COOKIE_NAME) String rawRefreshToken,
                                   HttpServletResponse response) {
        LoginResult result = authService.reissue(rawRefreshToken);
        setRefreshCookie(response, result.rawRefreshToken());
        return new ReissueResponse(result.accessToken(), result.tokenType(), result.expiresIn());
    }

    private void setRefreshCookie(HttpServletResponse response, String rawRefreshToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, rawRefreshToken)
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/api/auth")
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    @PostMapping("/logout")
    public void logout(@CookieValue(REFRESH_COOKIE_NAME) String rawRefreshToken, HttpServletResponse response) {
        authService.logout(rawRefreshToken);
        clearRefreshCookie(response);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE_NAME, "")
            .httpOnly(true)
            .secure(true)
            .sameSite("Strict")
            .path("/api/auth")
            .maxAge(0)   // 즉시 만료시켜서 브라우저에서 쿠키 삭제
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
