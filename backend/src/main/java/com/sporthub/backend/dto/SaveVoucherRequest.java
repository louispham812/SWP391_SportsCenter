package com.sporthub.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SaveVoucherRequest(
        String code,
        String discountType,
        BigDecimal discountValue,
        BigDecimal minPurchase,
        LocalDate validFrom,
        LocalDate validUntil,
        Integer usageLimit,
        String appliesTo,
        String status) {
}
