package com.sporthub.backend.service;

import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.service.gateway.PaymentGateway;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.*;

@Service
public class PaymentAttemptService {
    private final PaymentAttemptRepository attempts;
    private final GatewayReceiptRepository receipts;
    private final EngagementService engagement;
    private final UserRepository users;
    public PaymentAttemptService(PaymentAttemptRepository attempts, GatewayReceiptRepository receipts,
            EngagementService engagement, UserRepository users) {
        this.attempts = attempts; this.receipts = receipts; this.engagement = engagement; this.users = users;
    }

    // Caller holds the parent payment write lock: generation/callback/refund serialize on that row.
    @Transactional
    public Map<String, Object> generate(PaymentTransaction payment, PaymentGateway gateway, String ip) {
        LocalDateTime now = LocalDateTime.now();
        PaymentAttempt attempt = attempts.findFirstByPaymentIdAndStatusOrderByCreatedAtDesc(payment.getPaymentId(), "CREATED")
            .filter(a -> a.getExpiresAt().isAfter(now) && a.getPaymentUrl() != null).orElse(null);
        if (attempt == null) {
            attempt = new PaymentAttempt(); attempt.setPaymentId(payment.getPaymentId()); attempt.setAmount(payment.getAmount());
            attempt.setGatewayReference(payment.getPaymentId() + "_" + UUID.randomUUID().toString().replace("-", ""));
            attempt.setStatus("CREATED"); attempt.setCreatedAt(now); attempt.setExpiresAt(payment.getCreatedAt().plusMinutes(10));
            Map<String, Object> result = gateway.generatePaymentAttempt(payment.getPaymentId(), payment.getAmount(), payment.getItemDescription(), ip,
                attempt.getGatewayReference(), attempt.getExpiresAt());
            Object url = result.get("paymentUrl");
            if (!(url instanceof String) || ((String) url).isBlank()) throw new IllegalStateException("Gateway chưa trả link thanh toán.");
            Object merchantDate = result.get("merchantDate");
            if (!(merchantDate instanceof String) || !((String) merchantDate).matches("[0-9]{14}")) throw new IllegalStateException("Gateway thiếu thời điểm khởi tạo lần thanh toán.");
            attempt.setPaymentUrl((String) url); attempt.setMerchantDate((String) merchantDate); attempts.saveAndFlush(attempt);
        }
        Map<String, Object> result = new LinkedHashMap<>(); result.put("paymentId", payment.getPaymentId());
        result.put("amount", attempt.getAmount()); result.put("paymentUrl", attempt.getPaymentUrl());
        result.put("gateway", "VNPAY"); result.put("gatewayReference", attempt.getGatewayReference());
        result.put("expiresAt", attempt.getExpiresAt()); result.put("bookingType", payment.getBookingType()); return result;
    }

    public record ReceiptResult(boolean applyToOrder, boolean duplicate, String status, String transactionDate) {}

    @Transactional
    public ReceiptResult recordSuccess(PaymentTransaction payment, Map<String, String> params, BigDecimal amount) {
        String reference = params.get("vnp_TxnRef"); String transaction = params.get("vnp_TransactionNo");
        if (transaction == null || transaction.isBlank() || "0".equals(transaction)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu mã giao dịch gateway.");
        GatewayReceipt existing = receipts.findByGatewayTransactionNo(transaction).orElse(null);
        if (existing != null) {
            if (!payment.getPaymentId().equals(existing.getPaymentId()) || !reference.equals(existing.getGatewayReference()) || amount.compareTo(existing.getAmount()) != 0)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã giao dịch gateway đã gắn với chứng từ khác.");
            return new ReceiptResult(false, true, existing.getStatus(), existing.getTransactionDate());
        }
        PaymentAttempt attempt = attempts.findByGatewayReference(reference).orElse(null);
        if (attempt == null) {
            // A verified signed callback explicitly identifies a legacy reference; no time/amount guessing.
            attempt = new PaymentAttempt(); attempt.setPaymentId(payment.getPaymentId()); attempt.setGatewayReference(reference);
            attempt.setAmount(amount); attempt.setCreatedAt(LocalDateTime.now()); attempt.setExpiresAt(LocalDateTime.now());
            attempt.setStatus("SUCCESS"); attempt = attempts.saveAndFlush(attempt);
        } else if (!payment.getPaymentId().equals(attempt.getPaymentId()) || amount.compareTo(attempt.getAmount()) != 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sai liên kết lần thanh toán.");
        }
        boolean terminal = Set.of("PAID", "REFUNDED").contains(payment.getPaymentStatus());
        boolean canonical = terminal && transaction.equals(payment.getReferenceCode())
            && (payment.getGatewayReference() == null || reference.equals(payment.getGatewayReference()));
        GatewayReceipt receipt = new GatewayReceipt(); receipt.setPaymentId(payment.getPaymentId()); receipt.setAttemptId(attempt.getAttemptId());
        receipt.setGatewayReference(reference); receipt.setGatewayTransactionNo(transaction); receipt.setAmount(amount);
        String payDate = params.get("vnp_PayDate");
        String txnDate = (payDate != null && payDate.matches("[0-9]{14}")) ? payDate
            : (attempt.getMerchantDate() != null && attempt.getMerchantDate().matches("[0-9]{14}")) ? attempt.getMerchantDate()
            : java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now());
        receipt.setTransactionDate(txnDate); receipt.setCreatedAt(LocalDateTime.now());
        String status = !terminal ? "APPLIED" : canonical ? ("REFUNDED".equals(payment.getPaymentStatus()) ? "REFUNDED" : "APPLIED") : "EXCESS";
        receipt.setStatus(status); receipts.saveAndFlush(receipt);
        attempt.setStatus("SUCCESS");
        if (attempt.getMerchantDate() == null) attempt.setMerchantDate(txnDate);
        attempts.save(attempt);
        if ("EXCESS".equals(status)) {
            engagement.audit(payment.getMemberId(), "SYSTEM", "EXCESS_PAYMENT_RECEIVED", "paymentId=" + payment.getPaymentId() + ", gatewayTransaction=" + transaction);
            engagement.notifyUser(payment.getMemberId(), "Phát hiện thanh toán thêm cho cùng đơn", "Khoản thu " + amount + "đ đã được ghi nhận để đối soát; quyền lợi không được cấp lần nữa.", "PAYMENT");
            for (User manager : users.findByRole("MANAGER")) engagement.notifyUser(manager.getUserId(), "Khoản thanh toán dư cần đối soát", "Payment #" + payment.getPaymentId() + ", receipt #" + receipt.getReceiptId(), "PAYMENT_REVIEW");
        }
        return new ReceiptResult(!terminal, false, status, receipt.getTransactionDate());
    }

    @Transactional
    public void recordFailure(PaymentTransaction payment, String reference) {
        attempts.findByGatewayReference(reference).filter(a -> payment.getPaymentId().equals(a.getPaymentId()) && !"SUCCESS".equals(a.getStatus()))
            .ifPresent(a -> { a.setStatus("FAILED"); attempts.save(a); });
    }
}
