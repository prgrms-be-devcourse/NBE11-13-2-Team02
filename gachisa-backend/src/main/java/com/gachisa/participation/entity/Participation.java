package com.gachisa.participation.entity;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.groupbuy.entity.GroupBuy;
import com.gachisa.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "participation")
public class Participation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_buy_id", nullable = false)
    private GroupBuy groupBuy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipationStatus status;

    @Column(nullable = false)
    private LocalDateTime participatedAt;

    @Builder
    private Participation(GroupBuy groupBuy, User user, int quantity, ParticipationStatus status,
                           LocalDateTime participatedAt) {
        this.groupBuy = groupBuy;
        this.user = user;
        this.quantity = quantity;
        this.status = status;
        this.participatedAt = participatedAt;
    }

    public void changeStatus(ParticipationStatus newStatus) {
        if (this.status == ParticipationStatus.CONFIRMED && newStatus == ParticipationStatus.CANCELLED) {
            throw new CustomException(ErrorCode.CANNOT_CANCEL_CONFIRMED);
        }
        this.status = newStatus;
    }
}
