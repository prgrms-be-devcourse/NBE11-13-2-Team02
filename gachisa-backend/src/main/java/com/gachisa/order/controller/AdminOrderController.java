package com.gachisa.order.controller;

import com.gachisa.order.dto.DeliveryResponse;
import com.gachisa.order.dto.DeliveryStatusUpdateRequest;
import com.gachisa.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderService orderService;

    @PatchMapping("/{orderNumber}/delivery-status")
    public DeliveryResponse updateDeliveryStatus(
            @PathVariable String orderNumber,
            @Valid @RequestBody DeliveryStatusUpdateRequest request
    ) {
        return orderService.updateDeliveryStatusByAdmin(orderNumber, request.deliveryStatus());
    }
}
