package com.gachisa.auth.service;

import com.gachisa.global.security.JwtProperties;
import com.gachisa.global.security.JwtTokenProvider;
import com.gachisa.user.dto.UserInfo;
import com.gachisa.user.entity.UserRole;
import com.gachisa.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final String TOKEN_TYPE = "Bearer";

    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;

    @Transactional
    public UserInfo signUp(String email, String rawPassword, String name, UserRole role) {
        return userService.signUp(email, rawPassword, name, role);
    }

    @Transactional
    public LoginResult login(String email, String rawPassword) {
        UserInfo userInfo = userService.authenticate(email, rawPassword);
        return issueTokens(userInfo);
    }

    @Transactional
    public LoginResult reissue(String rawRefreshToken) {
        UserInfo userInfo = refreshTokenService.rotate(rawRefreshToken);
        return issueTokens(userInfo);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokenService.logout(rawRefreshToken);
    }

    private LoginResult issueTokens(UserInfo user) {
        String accessToken = jwtTokenProvider.createAccessToken(user.id(), user.name(), user.role());
        String rawRefreshToken = refreshTokenService.issue(user);
        long expiresIn = jwtProperties.accessTokenValidity().toSeconds();
        return new LoginResult(accessToken, TOKEN_TYPE, expiresIn, rawRefreshToken);
    }

    public record LoginResult(
        String accessToken,
        String tokenType,
        Long expiresIn,
        String rawRefreshToken
    ) {}
}
