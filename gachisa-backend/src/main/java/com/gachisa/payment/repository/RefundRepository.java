package com.gachisa.payment.repository;

import com.gachisa.payment.entity.Refund;
import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;
import java.util.Collection;
import com.gachisa.payment.entity.RefundStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefundRepository extends JpaRepository<Refund, Long> {

    Optional<Refund> findByPaymentId(Long paymentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from Refund r where r.id = :refundId")
    Optional<Refund> findByIdForUpdate(@Param("refundId") Long refundId);

    List<Refund> findTop100ByStatusInAndNextRetryAtLessThanEqualOrderByNextRetryAtAsc(
            Collection<RefundStatus> statuses,
            LocalDateTime nextRetryAt
    );
}
