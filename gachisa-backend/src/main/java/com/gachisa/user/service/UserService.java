package com.gachisa.user.service;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.user.dto.UserInfo;
import com.gachisa.user.entity.User;
import com.gachisa.user.entity.UserRole;
import com.gachisa.user.repository.UserRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserInfo signUp(String email, String rawPassword, String name, UserRole role) {
        if (userRepository.existsByEmail(email)) {
            throw new CustomException(ErrorCode.EMAIL_DUPLICATED);
        }

        User user = User.builder()
            .email(email)
            .password(passwordEncoder.encode(rawPassword))
            .name(name)
            .role(role)
            .createdAt(LocalDateTime.now())
            .build();

        User saved = userRepository.save(user);
        return toUserInfo(saved);
    }

    public UserInfo authenticate(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new CustomException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
        }

        return toUserInfo(user);
    }

    public UserInfo getById(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return toUserInfo(user);
    }

    @Transactional
    public UserInfo updateMe(Long userId, String name, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (name != null && !name.isBlank()) {
            user.updateName(name);
        }

        if (newPassword != null && !newPassword.isBlank()) {
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                throw new CustomException(ErrorCode.INVALID_CREDENTIALS);
            }
            user.changePassword(passwordEncoder.encode(newPassword));
        }

        return toUserInfo(user);
    }

    private UserInfo toUserInfo(User user) {
        return new UserInfo(user.getId(), user.getEmail(), user.getName(), user.getRole(), user.getCreatedAt());
    }
}
