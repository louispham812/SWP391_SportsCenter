package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EquipmentLoanResponse(
        Long loanId,
        Long memberId,
        String memberName,
        String phone,
        Long itemId,
        String itemName,
        Integer quantity,
        BigDecimal rentalPricePerHour,
        LocalDateTime loanedAt,
        LocalDateTime returnedAt,
        BigDecimal rentalFee,
        String status,
        String paymentMethod,
        Long recordedBy) {
}
