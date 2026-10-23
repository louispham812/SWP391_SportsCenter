package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record VoucherResponse(
        Long voucherId,
        String code,
        String discountType,
        BigDecimal discountValue,
        Integer discountPercent,
        BigDecimal discountAmount,
        BigDecimal minPurchase,
        LocalDate validFrom,
        LocalDate validUntil,
        Integer usageLimit,
        Integer usedCount,
        String appliesTo,
        String status) {
}
