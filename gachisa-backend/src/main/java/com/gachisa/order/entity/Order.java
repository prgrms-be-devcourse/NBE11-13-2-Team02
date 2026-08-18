package com.gachisa.order.entity;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "order_table")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long participationId;

    @Column(nullable = false, unique = true)
    private Long paymentId;

    @Column(nullable = false)
    private Long buyerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeliveryStatus deliveryStatus;

    @Column(length = 30)
    private String recipientName;

    @Column(length = 20)
    private String recipientPhone;

    @Column(length = 10)
    private String zipCode;

    @Column(length = 200)
    private String address;

    @Column(length = 200)
    private String addressDetail;

    @Column(length = 200)
    private String deliveryRequest;

    private LocalDateTime shippingStartedAt;

    private LocalDateTime deliveredAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    private Order(Long participationId, Long paymentId, Long buyerId,
                  DeliveryStatus deliveryStatus, LocalDateTime createdAt,
                  LocalDateTime updatedAt) {
        this.participationId = participationId;
        this.paymentId = paymentId;
        this.buyerId = buyerId;
        this.deliveryStatus = deliveryStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public void changeDeliveryStatus(DeliveryStatus newStatus, LocalDateTime changedAt) {
        if (deliveryStatus == newStatus) {
            return;
        }
        if (!deliveryStatus.canChangeTo(newStatus)) {
            throw new CustomException(ErrorCode.INVALID_DELIVERY_STATUS_TRANSITION);
        }
        deliveryStatus = newStatus;
        updatedAt = changedAt;
    }

    public void registerDeliveryAddress(String recipientName, String recipientPhone,
                                        String zipCode, String address, String addressDetail,
                                        String deliveryRequest, LocalDateTime registeredAt) {
        if (deliveryStatus != DeliveryStatus.PREPARING || this.address != null) {
            throw new CustomException(ErrorCode.DELIVERY_ADDRESS_ALREADY_REGISTERED);
        }

        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.zipCode = zipCode;
        this.address = address;
        this.addressDetail = addressDetail;
        this.deliveryRequest = deliveryRequest;
        this.deliveryStatus = DeliveryStatus.SHIPPING;
        this.shippingStartedAt = registeredAt;
        this.updatedAt = registeredAt;
    }

    public void changeDeliveryStatusByAdmin(DeliveryStatus newStatus, LocalDateTime changedAt) {
        if (newStatus != DeliveryStatus.PREPARING && address == null) {
            throw new CustomException(ErrorCode.DELIVERY_ADDRESS_REQUIRED);
        }

        deliveryStatus = newStatus;
        updatedAt = changedAt;

        if (newStatus == DeliveryStatus.PREPARING) {
            shippingStartedAt = null;
            deliveredAt = null;
            return;
        }
        if (shippingStartedAt == null) {
            shippingStartedAt = changedAt;
        }
        deliveredAt = newStatus == DeliveryStatus.DELIVERED ? changedAt : null;
    }
}
