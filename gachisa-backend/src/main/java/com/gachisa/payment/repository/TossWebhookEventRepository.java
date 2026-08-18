package com.gachisa.payment.repository;

import com.gachisa.payment.entity.TossWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TossWebhookEventRepository extends JpaRepository<TossWebhookEvent, Long> {

    boolean existsByTransmissionId(String transmissionId);
}
