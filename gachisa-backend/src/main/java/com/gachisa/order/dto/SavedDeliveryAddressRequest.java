package com.gachisa.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SavedDeliveryAddressRequest(
        @NotBlank @Size(max = 30) String addressName,
        @NotBlank @Size(max = 30) String recipientName,
        @NotBlank @Pattern(regexp = "^[0-9-]{9,20}$") String recipientPhone,
        @NotBlank @Pattern(regexp = "^[0-9]{5}$") String zipCode,
        @NotBlank @Size(max = 200) String address,
        @NotBlank @Size(max = 200) String addressDetail,
        @Size(max = 200) String deliveryRequest
) {
}
