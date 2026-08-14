package com.gachisa.user.controller;

import com.gachisa.global.security.CustomUserDetails;
import com.gachisa.user.dto.UserInfo;
import com.gachisa.user.dto.UserMeResponse;
import com.gachisa.user.dto.UserUpdateRequest;
import com.gachisa.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserMeResponse getMe(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UserInfo userInfo = userService.getById(userDetails.getUserId());
        return UserMeResponse.from(userInfo);
    }

    @PatchMapping("/me")
    public UserMeResponse updateMe(@AuthenticationPrincipal CustomUserDetails userDetails,
                                    @RequestBody UserUpdateRequest request) {
        UserInfo userInfo = userService.updateMe(
            userDetails.getUserId(),
            request.name(),
            request.currentPassword(),
            request.newPassword()
        );
        return UserMeResponse.from(userInfo);
    }
}
