package com.gachisa.groupbuy.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
public class GroupBuyCreateRequest {

    @NotNull
    private Long productId;

    @NotNull
    private Long productOptionId;

    @NotNull
    @Min(1)
    private Integer targetCount;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @DecimalMax(value = "1.0", inclusive = false)
    private BigDecimal discountRate;

    @NotNull
    private LocalDateTime openAt;

    @NotNull
    private LocalDateTime deadline;
}
