package com.sporthub.backend.dto;

import java.math.BigDecimal;

public record ValidateVoucherRequest(
        String code,
        BigDecimal amount,
        String appliesTo) {
}
