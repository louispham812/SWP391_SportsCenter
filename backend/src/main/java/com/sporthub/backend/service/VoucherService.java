package com.sporthub.backend.service;

import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.Voucher;
import com.sporthub.backend.repository.VoucherRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class VoucherService {
    private final VoucherRepository vouchers;
    private final PaymentTransactionRepository payments;
    public VoucherService(VoucherRepository vouchers, PaymentTransactionRepository payments) { this.vouchers = vouchers; this.payments = payments; }

    public BigDecimal discount(Voucher v, BigDecimal amount, String scope) {
        LocalDate now = LocalDate.now();
        if (v == null || amount == null || amount.signum() < 0 || !"ACTIVE".equals(v.getStatus())
                || (v.getValidFrom() != null && now.isBefore(v.getValidFrom()))
                || (v.getValidUntil() != null && now.isAfter(v.getValidUntil()))
                || v.getUsedCount() >= v.getUsageLimit()
                || (v.getMinPurchase() != null && amount.compareTo(v.getMinPurchase()) < 0)
                || (!"ALL".equals(v.getAppliesTo()) && !v.getAppliesTo().equals(scope)))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Voucher không áp dụng cho đơn hàng hoặc đã hết lượt/hiệu lực.");
        BigDecimal value = v.getDiscountValue();
        BigDecimal result;
        if ("PERCENT".equals(v.getDiscountType())) {
            if (value == null) value = BigDecimal.valueOf(v.getDiscountPercent() == null ? 0 : v.getDiscountPercent());
            if (value.signum() < 0 || value.compareTo(BigDecimal.valueOf(100)) > 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Voucher có mức giảm không hợp lệ.");
            result = amount.multiply(value).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            if (v.getDiscountAmount() != null && v.getDiscountAmount().signum() > 0) result = result.min(v.getDiscountAmount());
        } else if ("FIXED".equals(v.getDiscountType())) {
            result = value != null ? value : v.getDiscountAmount();
        } else throw new ResponseStatusException(HttpStatus.CONFLICT, "Voucher này không giảm giá lượt đặt.");
        if (result == null || result.signum() < 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "Voucher có mức giảm không hợp lệ.");
        return result.min(amount);
    }

    @Transactional
    public void apply(PaymentTransaction payment, String code) {
        Voucher v = vouchers.findByCodeForUpdate(code.trim()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy voucher."));
        BigDecimal off = discount(v, payment.getAmount(), "BOOKING_ONLY");
        payment.setAmount(payment.getAmount().subtract(off)); payment.setVoucherId(v.getVoucherId());
        v.setUsedCount(v.getUsedCount() + 1); vouchers.save(v);
        if (payment.getAmount().signum() == 0) { payment.setPaymentStatus("PAID"); payment.setPaymentCompletedAt(java.time.LocalDateTime.now()); }
        payments.save(payment);
    }

    @Transactional
    public void release(PaymentTransaction payment) {
        if (payment.getVoucherId() == null || "PAID".equals(payment.getPaymentStatus()) || "REFUNDED".equals(payment.getPaymentStatus())) return;
        vouchers.findByIdForUpdate(payment.getVoucherId()).ifPresent(v -> { v.setUsedCount(Math.max(0, v.getUsedCount() - 1)); vouchers.save(v); });
        payment.setVoucherId(null); payments.save(payment);
    }
}
