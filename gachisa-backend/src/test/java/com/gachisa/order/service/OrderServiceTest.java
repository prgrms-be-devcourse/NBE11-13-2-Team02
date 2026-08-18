package com.gachisa.order.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.global.util.TimeProvider;
import com.gachisa.order.dto.OrderCreateCommand;
import com.gachisa.order.entity.DeliveryStatus;
import com.gachisa.order.entity.Order;
import com.gachisa.order.repository.OrderRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 18, 12, 0);

    @Mock OrderRepository orderRepository;
    @Mock TimeProvider timeProvider;
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService(orderRepository, timeProvider);
    }

    @Test
    void createsPreparingOrderAfterPaymentCompletion() {
        OrderCreateCommand command = new OrderCreateCommand(10L, 20L, 30L);
        given(orderRepository.findByParticipationId(10L)).willReturn(Optional.empty());
        given(timeProvider.now()).willReturn(NOW);
        given(orderRepository.save(org.mockito.ArgumentMatchers.any(Order.class)))
                .willAnswer(invocation -> invocation.getArgument(0));

        var response = orderService.createOrderIfAbsent(command);

        assertThat(response.participationId()).isEqualTo(10L);
        assertThat(response.paymentId()).isEqualTo(20L);
        assertThat(response.deliveryStatus()).isEqualTo(DeliveryStatus.PREPARING);
    }

    @Test
    void returnsExistingOrderForDuplicatePaymentCompletion() {
        Order existingOrder = order(1L, DeliveryStatus.PREPARING);
        given(orderRepository.findByParticipationId(10L)).willReturn(Optional.of(existingOrder));

        var response = orderService.createOrderIfAbsent(new OrderCreateCommand(10L, 20L, 30L));

        assertThat(response.orderId()).isEqualTo(1L);
        verify(orderRepository, never()).save(org.mockito.ArgumentMatchers.any(Order.class));
    }

    @Test
    void buyerCanReadOwnOrders() {
        Order order = order(1L, DeliveryStatus.PREPARING);
        given(orderRepository.findAllByBuyerId(
                org.mockito.ArgumentMatchers.eq(30L),
                org.mockito.ArgumentMatchers.any(Pageable.class)))
                .willReturn(new PageImpl<>(List.of(order)));

        var response = orderService.getMyOrders(30L, 0, 20);

        assertThat(response.content()).hasSize(1);
        assertThat(response.content().get(0).orderId()).isEqualTo(1L);
    }

    @Test
    void deliveryStatusChangesInOrder() {
        Order order = order(1L, DeliveryStatus.PREPARING);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));
        given(timeProvider.now()).willReturn(NOW.plusHours(1));

        var response = orderService.updateDeliveryStatus(1L, DeliveryStatus.SHIPPING);

        assertThat(response.deliveryStatus()).isEqualTo(DeliveryStatus.SHIPPING);
    }

    @Test
    void deliveryStatusCannotSkipShipping() {
        Order order = order(1L, DeliveryStatus.PREPARING);
        given(orderRepository.findById(1L)).willReturn(Optional.of(order));
        given(timeProvider.now()).willReturn(NOW.plusHours(1));

        assertThatThrownBy(() ->
                orderService.updateDeliveryStatus(1L, DeliveryStatus.DELIVERED))
                .isInstanceOf(CustomException.class)
                .extracting(exception -> ((CustomException) exception).getErrorCode())
                .isEqualTo(ErrorCode.INVALID_DELIVERY_STATUS_TRANSITION);
    }

    private Order order(Long id, DeliveryStatus status) {
        Order order = Order.builder()
                .participationId(10L)
                .paymentId(20L)
                .buyerId(30L)
                .deliveryStatus(status)
                .createdAt(NOW)
                .updatedAt(NOW)
                .build();
        ReflectionTestUtils.setField(order, "id", id);
        return order;
    }
}
