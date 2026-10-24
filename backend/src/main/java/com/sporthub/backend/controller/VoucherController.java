package com.sporthub.backend.controller;

import com.sporthub.backend.dto.SaveVoucherRequest;
import com.sporthub.backend.dto.ValidateVoucherRequest;
import com.sporthub.backend.dto.ValidateVoucherResponse;
import com.sporthub.backend.dto.VoucherResponse;
import com.sporthub.backend.entity.Voucher;
import com.sporthub.backend.repository.VoucherRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@RestController
@CrossOrigin(origins = "*")
public class VoucherController {

    private final VoucherRepository voucherRepository;

    public VoucherController(VoucherRepository voucherRepository) {
        this.voucherRepository = voucherRepository;
    }

    @GetMapping("/api/v1/vouchers")
    @Transactional(readOnly = true)
    public ResponseEntity<List<VoucherResponse>> getActiveVouchers() {
        LocalDate today = LocalDate.now();
        List<VoucherResponse> vouchers = voucherRepository.findByStatusIgnoreCase("ACTIVE").stream()
                .filter(v -> v.getValidUntil() == null || !v.getValidUntil().isBefore(today))
                .filter(v -> v.getUsedCount() < v.getUsageLimit())
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(vouchers);
    }

    @PostMapping("/api/v1/vouchers/validate")
    @Transactional(readOnly = true)
    public ResponseEntity<ValidateVoucherResponse> validateVoucher(@RequestBody ValidateVoucherRequest request) {
        if (request == null || request.code() == null || request.code().isBlank()) {
            return ResponseEntity.ok(new ValidateVoucherResponse(false, "Mã ưu đãi không được để trống.", BigDecimal.ZERO, request == null ? BigDecimal.ZERO : request.amount(), null));
        }

        String code = request.code().trim().toUpperCase(Locale.ROOT);
        Voucher voucher = voucherRepository.findByCodeIgnoreCase(code).orElse(null);
        BigDecimal amount = request.amount() == null ? BigDecimal.ZERO : request.amount();

        if (voucher == null || !"ACTIVE".equalsIgnoreCase(voucher.getStatus())) {
            return ResponseEntity.ok(new ValidateVoucherResponse(false, "Mã ưu đãi không hợp lệ hoặc đã bị vô hiệu hóa.", BigDecimal.ZERO, amount, null));
        }

        LocalDate today = LocalDate.now();
        if (voucher.getValidFrom() != null && today.isBefore(voucher.getValidFrom())) {
            return ResponseEntity.ok(new ValidateVoucherResponse(false, "Mã ưu đãi chưa đến ngày áp dụng.", BigDecimal.ZERO, amount, null));
        }
        if (voucher.getValidUntil() != null && today.isAfter(voucher.getValidUntil())) {
            return ResponseEntity.ok(new ValidateVoucherResponse(false, "Mã ưu đãi đã hết hạn sử dụng.", BigDecimal.ZERO, amount, null));
        }
        if (voucher.getUsedCount() >= voucher.getUsageLimit()) {
            return ResponseEntity.ok(new ValidateVoucherResponse(false, "Mã ưu đãi đã hết lượt sử dụng.", BigDecimal.ZERO, amount, null));
        }
        if (voucher.getMinPurchase() != null && amount.compareTo(voucher.getMinPurchase()) < 0) {
            return ResponseEntity.ok(new ValidateVoucherResponse(
                    false,
                    "Đơn hàng chưa đạt giá trị tối thiểu " + voucher.getMinPurchase().longValue() + "đ.",
                    BigDecimal.ZERO,
                    amount,
                    toResponse(voucher)));
        }

        BigDecimal discount = BigDecimal.ZERO;
        String type = voucher.getDiscountType() == null ? "PERCENT" : voucher.getDiscountType().toUpperCase(Locale.ROOT);

        if ("FIXED".equals(type)) {
            discount = voucher.getDiscountValue() != null ? voucher.getDiscountValue()
                    : (voucher.getDiscountAmount() != null ? voucher.getDiscountAmount() : BigDecimal.ZERO);
            if (discount.compareTo(amount) > 0) {
                discount = amount;
            }
        } else if ("PERCENT".equals(type)) {
            BigDecimal percent = voucher.getDiscountValue() != null ? voucher.getDiscountValue()
                    : (voucher.getDiscountPercent() != null ? BigDecimal.valueOf(voucher.getDiscountPercent()) : BigDecimal.ZERO);
            discount = amount.multiply(percent).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            if (voucher.getDiscountAmount() != null && voucher.getDiscountAmount().signum() > 0 && discount.compareTo(voucher.getDiscountAmount()) > 0) {
                discount = voucher.getDiscountAmount();
            }
        }

        BigDecimal finalAmount = amount.subtract(discount);
        if (finalAmount.signum() < 0) finalAmount = BigDecimal.ZERO;

        return ResponseEntity.ok(new ValidateVoucherResponse(
                true,
                "Áp dụng mã ưu đãi thành công!",
                discount,
                finalAmount,
                toResponse(voucher)));
    }

    @GetMapping("/api/v1/manager/vouchers")
    @Transactional(readOnly = true)
    public ResponseEntity<List<VoucherResponse>> getAllVouchersForManager() {
        return ResponseEntity.ok(voucherRepository.findAll().stream().map(this::toResponse).toList());
    }

    @PostMapping("/api/v1/manager/vouchers")
    @Transactional
    public ResponseEntity<VoucherResponse> createVoucher(@RequestBody SaveVoucherRequest req) {
        if (req.code() == null || req.code().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã voucher không được để trống.");
        }
        String cleanCode = req.code().trim().toUpperCase(Locale.ROOT);
        if (voucherRepository.findByCodeIgnoreCase(cleanCode).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã voucher này đã tồn tại trong hệ thống.");
        }

        Voucher v = Voucher.builder()
                .code(cleanCode)
                .discountType(req.discountType() != null ? req.discountType().toUpperCase(Locale.ROOT) : "PERCENT")
                .discountValue(req.discountValue())
                .discountPercent("PERCENT".equalsIgnoreCase(req.discountType()) && req.discountValue() != null ? req.discountValue().intValue() : null)
                .discountAmount("FIXED".equalsIgnoreCase(req.discountType()) ? req.discountValue() : null)
                .minPurchase(req.minPurchase() != null ? req.minPurchase() : BigDecimal.ZERO)
                .validFrom(req.validFrom() != null ? req.validFrom() : LocalDate.now())
                .validUntil(req.validUntil() != null ? req.validUntil() : LocalDate.now().plusMonths(3))
                .usageLimit(req.usageLimit() != null ? req.usageLimit() : 100)
                .usedCount(0)
                .appliesTo(req.appliesTo() != null ? req.appliesTo() : "ALL")
                .status(req.status() != null ? req.status().toUpperCase(Locale.ROOT) : "ACTIVE")
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(voucherRepository.save(v)));
    }

    @PutMapping("/api/v1/manager/vouchers/{id}")
    @Transactional
    public ResponseEntity<VoucherResponse> updateVoucher(@PathVariable Long id, @RequestBody SaveVoucherRequest req) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy voucher."));

        if (req.code() != null && !req.code().isBlank()) {
            String newCode = req.code().trim().toUpperCase(Locale.ROOT);
            if (!newCode.equalsIgnoreCase(v.getCode()) && voucherRepository.findByCodeIgnoreCase(newCode).isPresent()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã voucher này đã tồn tại.");
            }
            v.setCode(newCode);
        }
        if (req.discountType() != null) v.setDiscountType(req.discountType().toUpperCase(Locale.ROOT));
        if (req.discountValue() != null) {
            v.setDiscountValue(req.discountValue());
            if ("PERCENT".equalsIgnoreCase(v.getDiscountType())) {
                v.setDiscountPercent(req.discountValue().intValue());
            } else {
                v.setDiscountAmount(req.discountValue());
            }
        }
        if (req.minPurchase() != null) v.setMinPurchase(req.minPurchase());
        if (req.validFrom() != null) v.setValidFrom(req.validFrom());
        if (req.validUntil() != null) v.setValidUntil(req.validUntil());
        if (req.usageLimit() != null) v.setUsageLimit(req.usageLimit());
        if (req.appliesTo() != null) v.setAppliesTo(req.appliesTo());
        if (req.status() != null) v.setStatus(req.status().toUpperCase(Locale.ROOT));

        return ResponseEntity.ok(toResponse(voucherRepository.save(v)));
    }

    @PatchMapping("/api/v1/manager/vouchers/{id}/toggle-status")
    @Transactional
    public ResponseEntity<VoucherResponse> toggleStatus(@PathVariable Long id) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy voucher."));
        v.setStatus("ACTIVE".equalsIgnoreCase(v.getStatus()) ? "INACTIVE" : "ACTIVE");
        return ResponseEntity.ok(toResponse(voucherRepository.save(v)));
    }

    @DeleteMapping("/api/v1/manager/vouchers/{id}")
    @Transactional
    public ResponseEntity<Void> deleteVoucher(@PathVariable Long id) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy voucher."));
        voucherRepository.delete(v);
        return ResponseEntity.noContent().build();
    }

    private VoucherResponse toResponse(Voucher v) {
        return new VoucherResponse(
                v.getVoucherId(),
                v.getCode(),
                v.getDiscountType(),
                v.getDiscountValue(),
                v.getDiscountPercent(),
                v.getDiscountAmount(),
                v.getMinPurchase(),
                v.getValidFrom(),
                v.getValidUntil(),
                v.getUsageLimit(),
                v.getUsedCount(),
                v.getAppliesTo(),
                v.getStatus());
    }
}
