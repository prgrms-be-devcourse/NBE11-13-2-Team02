package com.gachisa.order.controller;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.order.dto.SavedDeliveryAddressRequest;
import com.gachisa.order.dto.SavedDeliveryAddressResponse;
import com.gachisa.order.service.SavedDeliveryAddressService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me/delivery-addresses")
@RequiredArgsConstructor
public class SavedDeliveryAddressController {

    private final SavedDeliveryAddressService service;

    @GetMapping
    public List<SavedDeliveryAddressResponse> getMyAddresses(
            @AuthenticationPrincipal(expression = "userId") Long userId) {
        return service.getMyAddresses(requireUserId(userId));
    }

    @PostMapping
    public SavedDeliveryAddressResponse create(
            @AuthenticationPrincipal(expression = "userId") Long userId,
            @Valid @RequestBody SavedDeliveryAddressRequest request) {
        return service.create(requireUserId(userId), request);
    }

    @PatchMapping("/{addressId}")
    public SavedDeliveryAddressResponse update(
            @PathVariable Long addressId,
            @AuthenticationPrincipal(expression = "userId") Long userId,
            @Valid @RequestBody SavedDeliveryAddressRequest request) {
        return service.update(addressId, requireUserId(userId), request);
    }

    @DeleteMapping("/{addressId}")
    public void delete(@PathVariable Long addressId,
                       @AuthenticationPrincipal(expression = "userId") Long userId) {
        service.delete(addressId, requireUserId(userId));
    }

    private Long requireUserId(Long userId) {
        if (userId == null) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
        return userId;
    }
}
