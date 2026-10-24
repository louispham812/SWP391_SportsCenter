package com.sporthub.backend.dto;

import java.math.BigDecimal;

public record ValidateVoucherResponse(
        boolean valid,
        String message,
        BigDecimal discountAmount,
        BigDecimal finalAmount,
        VoucherResponse voucher) {
}
