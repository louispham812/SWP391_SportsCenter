package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MemberTransactionResponse(
        Long transactionId,
        String referenceCode,
        String type,
        String description,
        BigDecimal amount,
        String paymentMethod,
        String paymentStatus,
        LocalDateTime createdAt) {
}
