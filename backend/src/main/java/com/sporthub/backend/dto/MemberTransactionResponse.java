package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record MemberTransactionResponse(
        Long transactionId,
        String referenceCode,
        String itemType,        // Frontend-friendly: MEMBERSHIP, COURT, CLASS, PT, QUOTA
        String itemName,        // Chi tiết: "Gói VIP 6 Tháng", "Sân Cầu Lông 01"
        BigDecimal amount,
        String paymentMethod,
        String paymentStatus,
        LocalDateTime createdAt) {
}
