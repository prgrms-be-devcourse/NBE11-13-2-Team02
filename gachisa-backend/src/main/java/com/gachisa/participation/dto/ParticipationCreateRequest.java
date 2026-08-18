package com.gachisa.participation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ParticipationCreateRequest {

    @NotNull
    @Min(1)
    private Integer quantity;
}
