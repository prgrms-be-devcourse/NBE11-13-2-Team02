package com.gachisa.groupbuy.repository;

// import jakarta.persistence.LockModeType;
// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Lock;
// import org.springframework.data.jpa.repository.Query;
// import org.springframework.data.repository.query.Param;
// import java.util.Optional;

// TODO: extends JpaRepository<GroupBuy, Long>
//
// 참여(Participation) 동시성 제어의 핵심 메서드:
//
// @Lock(LockModeType.PESSIMISTIC_WRITE)
// @Query("SELECT g FROM GroupBuy g WHERE g.id = :id")
// Optional<GroupBuy> findByIdForUpdate(@Param("id") Long id);
//
// ParticipationService에서 이 메서드로 row를 잠근 뒤
// currentCount를 증가시키고 save() -> 트랜잭션 종료 시 락 해제
public interface GroupBuyRepository {
}
