package com.gachisa.order.service;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.global.util.TimeProvider;
import com.gachisa.groupbuy.dto.GroupBuyPaymentInfo;
import com.gachisa.groupbuy.service.GroupBuyService;
import com.gachisa.order.dto.DeliveryAddressRequest;
import com.gachisa.order.dto.DeliveryResponse;
import com.gachisa.order.dto.OrderCreateCommand;
import com.gachisa.order.dto.OrderListResponse;
import com.gachisa.order.dto.OrderResponse;
import com.gachisa.order.entity.DeliveryStatus;
import com.gachisa.order.entity.Order;
import com.gachisa.order.repository.OrderRepository;
import com.gachisa.product.dto.ProductResponse;
import com.gachisa.product.service.ProductService;
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
    private final GroupBuyService groupBuyService;
    private final ProductService productService;

    @Transactional
    public OrderResponse createOrderIfAbsent(OrderCreateCommand command) {
        Order existingOrder = orderRepository.findByParticipationId(command.participationId())
                .orElse(null);
        if (existingOrder != null) {
            return OrderResponse.from(existingOrder);
        }

        GroupBuyPaymentInfo groupBuy = groupBuyService.getPaymentInfo(command.groupBuyId());
        ProductResponse product = productService.getProduct(groupBuy.productId());
        LocalDateTime now = timeProvider.now();
        Order order = Order.builder()
                .participationId(command.participationId())
                .paymentId(command.paymentId())
                .buyerId(command.buyerId())
                .groupBuyId(command.groupBuyId())
                .productId(product.id())
                .productName(product.name())
                .productImageUrl(product.imageUrl())
                .quantity(command.quantity())
                .amount(command.amount())
                .deliveryStatus(DeliveryStatus.WAITING_FOR_GROUP_BUY)
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
        Page<Order> orders = orderRepository.findAllByBuyerIdAndDeliveryStatusNot(
                buyerId, DeliveryStatus.CANCELLED, pageable);
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
        int shippingCount = orderRepository.startShippingDue(now.minusDays(1), now);
        int deliveredCount = orderRepository.completeDeliveriesDue(now.minusDays(2), now);
        return shippingCount + deliveredCount;
    }

    @Transactional
    public int startPreparationForGroupBuy(Long groupBuyId) {
        LocalDateTime now = timeProvider.now();
        return orderRepository.startPreparationForGroupBuy(groupBuyId, now);
    }

    @Transactional
    public void reflectRefund(Long paymentId) {
        orderRepository.findByPaymentId(paymentId)
                .ifPresent(order -> order.reflectRefund(timeProvider.now()));
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
