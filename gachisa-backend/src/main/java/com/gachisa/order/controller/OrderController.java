package com.gachisa.order.controller;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.order.dto.DeliveryAddressRequest;
import com.gachisa.order.dto.DeliveryResponse;
import com.gachisa.order.dto.DeliveryStatusUpdateRequest;
import com.gachisa.order.dto.OrderListResponse;
import com.gachisa.order.dto.OrderResponse;
import com.gachisa.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/users/me/orders")
    public OrderListResponse getMyOrders(
            @AuthenticationPrincipal(expression = "userId") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return orderService.getMyOrders(requireUserId(userId), page, size);
    }

    @GetMapping("/users/me/orders/{orderId}")
    public OrderResponse getMyOrder(
            @PathVariable Long orderId,
            @AuthenticationPrincipal(expression = "userId") Long userId
    ) {
        return orderService.getMyOrder(orderId, requireUserId(userId));
    }

    @PostMapping("/users/me/orders/{orderId}/delivery-address")
    public DeliveryResponse registerDeliveryAddress(
            @PathVariable Long orderId,
            @AuthenticationPrincipal(expression = "userId") Long userId,
            @Valid @RequestBody DeliveryAddressRequest request
    ) {
        return orderService.registerDeliveryAddress(orderId, requireUserId(userId), request);
    }

    @GetMapping("/users/me/orders/{orderId}/delivery")
    public DeliveryResponse getMyDelivery(
            @PathVariable Long orderId,
            @AuthenticationPrincipal(expression = "userId") Long userId
    ) {
        return orderService.getMyDelivery(orderId, requireUserId(userId));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/admin/orders/{orderId}/delivery-status")
    public DeliveryResponse updateDeliveryStatusByAdmin(
            @PathVariable Long orderId,
            @Valid @RequestBody DeliveryStatusUpdateRequest request
    ) {
        return orderService.updateDeliveryStatusByAdmin(orderId, request.deliveryStatus());
    }

    private Long requireUserId(Long userId) {
        if (userId == null) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
        return userId;
    }
}
