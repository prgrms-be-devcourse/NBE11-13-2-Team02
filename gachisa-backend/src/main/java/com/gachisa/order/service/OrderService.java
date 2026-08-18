package com.gachisa.order.service;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.global.util.TimeProvider;
import com.gachisa.order.dto.DeliveryAddressRequest;
import com.gachisa.order.dto.DeliveryResponse;
import com.gachisa.order.dto.OrderCreateCommand;
import com.gachisa.order.dto.OrderListResponse;
import com.gachisa.order.dto.OrderResponse;
import com.gachisa.order.entity.DeliveryStatus;
import com.gachisa.order.entity.Order;
import com.gachisa.order.repository.OrderRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final int MAX_PAGE_SIZE = 100;

    private final OrderRepository orderRepository;
    private final TimeProvider timeProvider;

    @Transactional
    public OrderResponse createOrderIfAbsent(OrderCreateCommand command) {
        Order existingOrder = orderRepository.findByParticipationId(command.participationId())
                .orElse(null);
        if (existingOrder != null) {
            return OrderResponse.from(existingOrder);
        }

        LocalDateTime now = timeProvider.now();
        Order order = Order.builder()
                .participationId(command.participationId())
                .paymentId(command.paymentId())
                .buyerId(command.buyerId())
                .deliveryStatus(DeliveryStatus.PREPARING)
                .createdAt(now)
                .updatedAt(now)
                .build();
        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public OrderListResponse getMyOrders(Long buyerId, int page, int size) {
        PageRequest pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        Page<Order> orders = orderRepository.findAllByBuyerId(buyerId, pageable);
        return OrderListResponse.from(orders);
    }

    @Transactional(readOnly = true)
    public OrderResponse getMyOrder(Long orderId, Long buyerId) {
        Order order = getOrder(orderId);
        validateBuyer(order, buyerId);
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public Long getOrderIdByParticipationId(Long participationId) {
        return orderRepository.findByParticipationId(participationId)
                .map(Order::getId)
                .orElse(null);
    }

    @Transactional
    public DeliveryResponse registerDeliveryAddress(Long orderId, Long buyerId,
                                                    DeliveryAddressRequest request) {
        Order order = getOrder(orderId);
        validateBuyer(order, buyerId);
        order.registerDeliveryAddress(
                request.recipientName(),
                request.recipientPhone(),
                request.zipCode(),
                request.address(),
                request.addressDetail(),
                request.deliveryRequest(),
                timeProvider.now()
        );
        return DeliveryResponse.from(order);
    }

    @Transactional(readOnly = true)
    public DeliveryResponse getMyDelivery(Long orderId, Long buyerId) {
        Order order = getOrder(orderId);
        validateBuyer(order, buyerId);
        return DeliveryResponse.from(order);
    }

    @Transactional
    public DeliveryResponse updateDeliveryStatusByAdmin(Long orderId, DeliveryStatus deliveryStatus) {
        Order order = getOrder(orderId);
        order.changeDeliveryStatusByAdmin(deliveryStatus, timeProvider.now());
        return DeliveryResponse.from(order);
    }

    @Transactional
    public int completeDeliveriesDue() {
        LocalDateTime now = timeProvider.now();
        return orderRepository.completeDeliveriesDue(now.minusDays(2), now);
    }

    private Order getOrder(Long orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException(ErrorCode.ORDER_NOT_FOUND));
    }

    private void validateBuyer(Order order, Long buyerId) {
        if (!order.getBuyerId().equals(buyerId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}
