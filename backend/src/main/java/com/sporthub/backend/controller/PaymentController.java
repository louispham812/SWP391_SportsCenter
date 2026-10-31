package com.sporthub.backend.controller;

import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller để frontend polling payment status
 * 
 * Sau khi tạo booking và generate QR, frontend sẽ poll endpoint này
 * để kiểm tra xem payment đã được confirm từ webhook chưa
 */
@RestController
@RequestMapping("/api/v1/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    public PaymentController(PaymentTransactionRepository paymentTransactionRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
    }

    /**
     * Get payment status for polling
     * 
     * Frontend sẽ gọi endpoint này mỗi 3-5s để check xem
     * webhook đã update payment status thành PAID chưa
     * 
     * @param paymentId Payment ID từ booking confirmation
     * @return Payment status details
     */
    @GetMapping("/{paymentId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable Long paymentId) {
        PaymentTransaction payment = paymentTransactionRepository
            .findById(paymentId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Payment not found"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", payment.getPaymentId());
        response.put("paymentStatus", payment.getPaymentStatus());
        response.put("amount", payment.getAmount());
        response.put("paymentMethod", payment.getPaymentMethod());
        response.put("referenceCode", payment.getReferenceCode());
        response.put("createdAt", payment.getCreatedAt());
        
        return ResponseEntity.ok(response);
    }
}
