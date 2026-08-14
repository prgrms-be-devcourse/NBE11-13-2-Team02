package com.gachisa.auth.service;

import com.gachisa.auth.entity.RefreshToken;
import com.gachisa.auth.repository.RefreshTokenRepository;
import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.global.security.JwtProperties;
import com.gachisa.global.security.TokenHashUtil;
import com.gachisa.user.dto.UserInfo;
import com.gachisa.user.service.UserService;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserService userService;
    private final TokenHashUtil tokenHashUtil;
    private final JwtProperties jwtProperties;

    @Transactional
    public String issue(UserInfo user) {
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = tokenHashUtil.sha256(rawToken);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plus(jwtProperties.refreshTokenValidity());

        RefreshToken refreshToken = RefreshToken.builder()
            .userId(user.id())
            .tokenHash(tokenHash)
            .issuedAt(now)
            .expiresAt(expiresAt)
            .build();
        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    @Transactional
    public UserInfo rotate(String rawToken) {
        String tokenHash = tokenHashUtil.sha256(rawToken);

        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
            .orElseThrow(() -> new CustomException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        if (token.isRevoked()) {
            revokeAllByUser(token.getUserId());
            throw new CustomException(ErrorCode.REFRESH_TOKEN_REUSED);
        }

        token.validateUsable();
        token.revoke();

        return userService.getById(token.getUserId());
    }

    @Transactional
    public void revokeAllByUser(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    @Transactional
    public void logout(String rawToken) {
        String tokenHash = tokenHashUtil.sha256(rawToken);
        refreshTokenRepository.findByTokenHash(tokenHash)
            .ifPresent(RefreshToken::revoke);
    }
}
