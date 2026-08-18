package com.gachisa.order.repository;

import com.gachisa.order.entity.Order;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByParticipationId(Long participationId);

    Page<Order> findAllByBuyerId(Long buyerId, Pageable pageable);

    @Modifying(clearAutomatically = true)
    @Query("""
            update Order o
               set o.deliveryStatus = com.gachisa.order.entity.DeliveryStatus.DELIVERED,
                   o.deliveredAt = :completedAt,
                   o.updatedAt = :completedAt
             where o.deliveryStatus = com.gachisa.order.entity.DeliveryStatus.SHIPPING
               and o.shippingStartedAt <= :shippingDeadline
            """)
    int completeDeliveriesDue(@Param("shippingDeadline") LocalDateTime shippingDeadline,
                              @Param("completedAt") LocalDateTime completedAt);
}
