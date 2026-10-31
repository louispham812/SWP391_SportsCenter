package com.sporthub.backend.controller;

import com.sporthub.backend.dto.SePayWebhookDTO;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.service.EngagementService;
import com.sporthub.backend.service.payment.BookingPaymentHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller lắng nghe webhook từ SePay khi có giao dịch tiền vào
 * 
 * Rule 10 (updated): Nội dung chuyển khoản dùng payment_id thay vì booking_id
 * - Format: FSPORT <payment_id>
 * - VD: FSPORT 128
 * 
 * Luồng xử lý:
 * 1. SePay gửi POST request đến /api/webhook/sepay khi có tiền vào VA 962470DS8D
 * 2. Kiểm tra transferType = "in" và content chứa "FSPORT"
 * 3. Tách payment_id từ content (VD: "FSPORT 128" -> lấy ra "128")
 * 4. Tìm PaymentTransaction theo ID và cập nhật thành PAID
 * 5. Rule 9: Nếu booking đã CANCELLED (timeout), giữ nguyên và thông báo user liên hệ hoàn tiền
 * 6. Ghi audit log
 * 7. Trả về {success: true} cho SePay
 */
@RestController
@RequestMapping("/api/webhook")
@CrossOrigin(origins = "*")
public class SePayWebhookController {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final EngagementService engagementService;
    private final List<BookingPaymentHandler> paymentHandlers; // ✅ Strategy pattern

    @Autowired
    public SePayWebhookController(
            PaymentTransactionRepository paymentTransactionRepository,
            EngagementService engagementService,
            List<BookingPaymentHandler> paymentHandlers) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.engagementService = engagementService;
        this.paymentHandlers = paymentHandlers;
    }

    /**
     * Endpoint nhận webhook từ SePay
     * 
     * @param payload Dữ liệu giao dịch từ SePay
     * @return {success: true} để SePay không retry
     */
    @PostMapping("/sepay")
    public ResponseEntity<?> handleSePayWebhook(@RequestBody SePayWebhookDTO payload) {
        System.out.println(">>> Webhook SePay triggered: " + payload);

        // 1. Kiểm tra loại giao dịch là tiền vào (in)
        if (!"in".equalsIgnoreCase(payload.getTransferType())) {
            System.out.println("Bỏ qua: Không phải giao dịch tiền vào (transferType != in)");
            return ResponseEntity.ok(Map.of("success", true));
        }

        String content = payload.getContent();
        
        // 2. Kiểm tra nếu nội dung chuyển khoản chứa tiền tố dự án
        if (content == null || !content.toUpperCase().contains("FSPORT")) {
            System.out.println("Bỏ qua: Nội dung chuyển khoản không chứa FSPORT");
            return ResponseEntity.ok(Map.of("success", true));
        }

        // 3. Tách payment_id từ nội dung chuyển khoản
        // Rule 10 (updated): Format "FSPORT <payment_id>" (VD: FSPORT 128)
        String[] parts = content.split("\\s+");
        String paymentIdStr = null;
        
        for (int i = 0; i < parts.length; i++) {
            if (parts[i].equalsIgnoreCase("FSPORT") && (i + 1) < parts.length) {
                paymentIdStr = parts[i + 1];
                break;
            }
        }

        if (paymentIdStr == null) {
            System.out.println(">>> Không tìm thấy payment_id trong nội dung: " + content);
            return ResponseEntity.ok(Map.of("success", true, "message", "Không tìm thấy payment ID"));
        }

        System.out.println("===> Cập nhật thanh toán cho Payment #" + paymentIdStr + " với số tiền " + payload.getTransferAmount());

        // 4. Parse payment_id
        Long paymentId;
        try {
            paymentId = Long.parseLong(paymentIdStr.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            System.out.println("Invalid payment_id format: " + paymentIdStr);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invalid payment ID"));
        }

        // 5. Tìm payment transaction trực tiếp bằng payment_id
        PaymentTransaction payment = paymentTransactionRepository.findById(paymentId).orElse(null);
        
        if (payment == null) {
            System.out.println(">>> Payment not found for ID: " + paymentId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Payment not found"));
        }
        
        // 6. Idempotency check
        if ("PAID".equalsIgnoreCase(payment.getPaymentStatus())) {
            System.out.println(">>> Payment already PAID, skipping: " + paymentId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Already paid"));
        }
        
        // 7. Rule 10: Verify transfer amount >= payment amount
        if (payload.getTransferAmount() < payment.getAmount().doubleValue()) {
            System.out.println(">>> Transfer amount insufficient: " + payload.getTransferAmount() + " < " + payment.getAmount());
            return ResponseEntity.ok(Map.of("success", true, "message", "Amount insufficient"));
        }
        
        // 8. Update payment status to PAID
        payment.setPaymentStatus("PAID");
        payment.setPaymentMethod("BANK_TRANSFER");
        payment.setReferenceCode(payload.getCode() != null ? payload.getCode() : payload.getReferenceCode());
        paymentTransactionRepository.save(payment);
        
        System.out.println("✓✓✓ Payment #" + paymentId + " marked as PAID");
        
        // ✅ 9. Use Strategy Pattern to handle booking confirmation
        for (BookingPaymentHandler handler : paymentHandlers) {
            Map<String, Object> result = handler.handlePaymentConfirmation(payment, payload.getTransferAmount());
            if (result != null) {
                return ResponseEntity.ok(result);
            }
        }
        
        // Payment found but no linked booking (edge case)
        System.out.println("✓ Payment #" + paymentId + " updated but no linked booking found");
        return ResponseEntity.ok(Map.of("success", true, "paymentId", paymentId));
    }
}
