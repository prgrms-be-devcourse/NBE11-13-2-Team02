package com.gachisa.participation.service;

import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.participation.dto.ParticipationPaymentInfo;
import com.gachisa.participation.entity.Participation;
import com.gachisa.participation.entity.ParticipationStatus;
import com.gachisa.participation.repository.ParticipationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ParticipationService {

    private final ParticipationRepository participationRepository;

    @Transactional(readOnly = true)
    public ParticipationPaymentInfo getPaymentInfo(Long participationId) {
        Participation participation = participationRepository.findPaymentInfoById(participationId)
                .orElseThrow(() -> new CustomException(ErrorCode.PARTICIPATION_NOT_FOUND));

        return new ParticipationPaymentInfo(
                participation.getId(),
                participation.getUser().getId(),
                participation.getGroupBuy().getId(),
                participation.getQuantity(),
                participation.getStatus() == ParticipationStatus.PARTICIPATING
        );
    }

    @Transactional
    public void confirmPayment(Long participationId) {
        Participation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new CustomException(ErrorCode.PARTICIPATION_NOT_FOUND));

        if (participation.getStatus() == ParticipationStatus.CONFIRMED) {
            return;
        }
        if (participation.getStatus() != ParticipationStatus.PARTICIPATING) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        participation.changeStatus(ParticipationStatus.CONFIRMED);
    }

    @Transactional
    public void refundPayment(Long participationId) {
        Participation participation = participationRepository.findById(participationId)
                .orElseThrow(() -> new CustomException(ErrorCode.PARTICIPATION_NOT_FOUND));

        if (participation.getStatus() == ParticipationStatus.REFUNDED) {
            return;
        }
        if (participation.getStatus() != ParticipationStatus.CONFIRMED) {
            throw new CustomException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        participation.changeStatus(ParticipationStatus.REFUNDED);
    }
}
