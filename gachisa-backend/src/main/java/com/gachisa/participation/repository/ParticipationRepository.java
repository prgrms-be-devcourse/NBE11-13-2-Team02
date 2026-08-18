package com.gachisa.participation.repository;

import com.gachisa.participation.entity.Participation;
import com.gachisa.participation.entity.ParticipationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    Optional<Participation> findByIdAndUser_Id(Long id, Long userId);

    Page<Participation> findByUser_Id(Long userId, Pageable pageable);

    Page<Participation> findByUser_IdAndStatus(Long userId, ParticipationStatus status, Pageable pageable);

    /** 마감 배치에서 특정 공동구매의 참여자 전원을 순회 처리할 때 사용 */
    List<Participation> findByGroupBuy_IdAndStatus(Long groupBuyId, ParticipationStatus status);
}
