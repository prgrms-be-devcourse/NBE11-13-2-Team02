package com.gachisa.groupbuy.repository;

import com.gachisa.groupbuy.entity.GroupBuy;
import com.gachisa.groupbuy.entity.GroupBuyStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface GroupBuyRepository extends JpaRepository<GroupBuy, Long>, JpaSpecificationExecutor<GroupBuy> {

    /**
     * 참여(Participation) 동시성 제어의 핵심 메서드.
     * SELECT ... FOR UPDATE 로 해당 row를 잠근 뒤 반환한다.
     * 같은 트랜잭션 안에서 currentCount를 변경하고 save()하면,
     * 트랜잭션 종료 시점에 락이 해제되어 다음 대기 트랜잭션이 최신 값을 보게 된다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM GroupBuy g WHERE g.id = :id")
    Optional<GroupBuy> findByIdForUpdate(@Param("id") Long id);

    Page<GroupBuy> findByStatus(GroupBuyStatus status, Pageable pageable);

    /** 마감 배치 대상 조회: 모집중인데 마감시각이 지난 공동구매 */
    List<GroupBuy> findByStatusAndDeadlineBefore(GroupBuyStatus status, LocalDateTime now);
}
