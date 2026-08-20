package com.gachisa.groupbuy.repository;

import com.gachisa.groupbuy.entity.GroupBuy;
import com.gachisa.groupbuy.entity.GroupBuyStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GroupBuyRepository extends JpaRepository<GroupBuy, Long>, JpaSpecificationExecutor<GroupBuy> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM GroupBuy g WHERE g.id = :id")
    Optional<GroupBuy> findByIdForUpdate(@Param("id") Long id);

    /** 마감 배치 대상 조회: 모집중인데 마감시각이 지난 공동구매 */
    List<GroupBuy> findByStatusAndDeadlineBefore(GroupBuyStatus status, LocalDateTime now);
}
