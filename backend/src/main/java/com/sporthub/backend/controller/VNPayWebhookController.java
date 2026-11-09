package com.sporthub.backend.controller;

import com.sporthub.backend.dto.PaymentConfirmationResult;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.service.PaymentAttemptService;
import com.sporthub.backend.service.gateway.VNPayGateway;
import com.sporthub.backend.service.payment.BookingPaymentHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/webhooks/vnpay")
public class VNPayWebhookController {
    private final VNPayGateway gateway;
    private final PaymentTransactionRepository payments;
    private final List<BookingPaymentHandler> handlers;
    @Autowired private PaymentAttemptService attempts;
    public VNPayWebhookController(VNPayGateway gateway, PaymentTransactionRepository payments, List<BookingPaymentHandler> handlers) {
        this.gateway = gateway; this.payments = payments; this.handlers = handlers;
    }
    @GetMapping("/return") @Transactional
    public ResponseEntity<?> handleReturn(@RequestParam Map<String, String> params) { return ResponseEntity.ok(process(params)); }

    @GetMapping("/ipn") @Transactional
    public ResponseEntity<?> handleIPN(@RequestParam Map<String, String> params) {
        Map<String, Object> result = process(params);
        return ResponseEntity.ok(Map.of("RspCode", result.get("rspCode"), "Message", result.get("message")));
    }
    private Map<String, Object> process(Map<String, String> params) {
        if (!gateway.verifySignature(params, params.get("vnp_SecureHash"))) return error("97", "Chữ ký không hợp lệ.");
        Long id; BigDecimal amount;
        try {
            id = Long.valueOf(params.get("vnp_TxnRef").split("_", 2)[0]);
            amount = new BigDecimal(params.get("vnp_Amount")).movePointLeft(2);
            if (amount.signum() <= 0) return error("04", "Số tiền không hợp lệ.");
        } catch (Exception e) { return error("04", "Mã hoặc số tiền giao dịch không hợp lệ."); }
        PaymentTransaction payment = payments.findByIdForUpdate(id).orElse(null);
        if (payment == null) return error("01", "Không tìm thấy giao dịch.");
        if (payment.getAmount().compareTo(amount) != 0) return error("04", "Số tiền không khớp.");
        boolean successful = "00".equals(params.get("vnp_ResponseCode"))
            && (!params.containsKey("vnp_TransactionStatus") || "00".equals(params.get("vnp_TransactionStatus")));
        if (!successful) {
            attempts.recordFailure(payment, params.get("vnp_TxnRef"));
            if ("PENDING".equals(payment.getPaymentStatus())) { payment.setPaymentStatus("FAILED"); payments.save(payment); }
            return response(false, "00", "Thanh toán chưa thành công.", payment.getPaymentStatus(), id);
        }
        String transaction = params.get("vnp_TransactionNo");
        if (transaction == null || transaction.isBlank() || "0".equals(transaction)) return error("02", "Thiếu mã giao dịch gateway.");
        PaymentAttemptService.ReceiptResult receipt = attempts.recordSuccess(payment, params, amount);
        if (!receipt.applyToOrder()) {
            boolean excess = "EXCESS".equals(receipt.status()) || "REVIEW_REQUIRED".equals(receipt.status());
            String status = excess ? receipt.status() : payment.getPaymentStatus();
            return response(!"REFUNDED".equals(status), "00", excess
                ? "Khoản thanh toán thêm đã được ghi nhận để đối soát; đơn hàng không được cấp quyền lợi lần nữa."
                : "REFUNDED".equals(status) ? "Giao dịch đã hoàn tiền." : "Giao dịch đã được xử lý.", status, id);
        }
        payment.setPaymentStatus("PAID"); payment.setPaymentMethod("VNPAY"); payment.setReferenceCode(transaction);
        payment.setGatewayReference(params.get("vnp_TxnRef")); payment.setTransactionDate(receipt.transactionDate());
        payment.setPaymentCompletedAt(LocalDateTime.now()); payments.save(payment);
        PaymentConfirmationResult confirmation = null;
        for (BookingPaymentHandler handler : handlers) {
            confirmation = handler.handlePaymentConfirmation(payment, amount.doubleValue());
            if (confirmation != null) break;
        }
        String status = confirmation == null ? "PAID" : confirmation.getStatus();
        String message = "CANCELLED".equals(status) ? "Đã nhận tiền sau khi lịch không còn khả dụng. Yêu cầu hoàn tiền đã được tạo."
            : "PENDING_APPROVAL".equals(status) ? "Đã nhận tiền; gói đang chờ Quản lý duyệt." : "Thanh toán thành công.";
        Map<String, Object> result = response(true, "00", message, status, id);
        if (confirmation != null) {
            result.put("bookingId", confirmation.getBookingId()); result.put("membershipId", confirmation.getMembershipId());
            result.put("bookingType", confirmation.getBookingType());
        }
        return result;
    }
    private Map<String, Object> error(String code, String message) { return response(false, code, message, "ERROR", null); }
    private Map<String, Object> response(boolean success, String code, String message, String status, Long id) {
        Map<String, Object> result = new LinkedHashMap<>(); result.put("success", success); result.put("rspCode", code);
        result.put("message", message); result.put("status", status); result.put("paymentId", id); return result;
    }
}
