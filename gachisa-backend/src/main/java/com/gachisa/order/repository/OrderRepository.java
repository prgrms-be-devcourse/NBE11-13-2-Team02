package com.gachisa.order.repository;

import com.gachisa.order.entity.Order;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByParticipationId(Long participationId);

    Page<Order> findAllByBuyerId(Long buyerId, Pageable pageable);
}
