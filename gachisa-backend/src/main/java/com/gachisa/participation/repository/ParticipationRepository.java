package com.gachisa.participation.repository;

import com.gachisa.participation.entity.Participation;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    @EntityGraph(attributePaths = {"user", "groupBuy"})
    @Query("select p from Participation p where p.id = :id")
    Optional<Participation> findPaymentInfoById(@Param("id") Long id);
}
