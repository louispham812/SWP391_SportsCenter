package com.sporthub.backend.controller;

import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.service.EngagementService;
import com.sporthub.backend.service.payment.BookingPaymentHandler;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/receptionist/payments")
public class PaymentCollectionController {
    private final PaymentTransactionRepository payments;
    private final List<BookingPaymentHandler> handlers;
    private final EngagementService engagement;
    public PaymentCollectionController(PaymentTransactionRepository payments, List<BookingPaymentHandler> handlers, EngagementService engagement) {
        this.payments = payments; this.handlers = handlers; this.engagement = engagement;
    }
    @GetMapping("/pending-cash")
    @Transactional(readOnly = true)
    public List<PaymentTransaction> pendingCash() {
        return payments.findByPaymentMethodAndPaymentStatusOrderByCreatedAtDesc("CASH_COUNTER", "PENDING").stream()
            .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().plusMinutes(10).isAfter(LocalDateTime.now())).toList();
    }
    @PostMapping("/{id}/confirm-cash")
    @Transactional
    public PaymentTransaction confirmCash(@PathVariable Long id, Authentication auth) {
        PaymentTransaction payment = payments.findByIdForUpdate(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!"CASH_COUNTER".equals(payment.getPaymentMethod()) || !"PENDING".equals(payment.getPaymentStatus())
                || payment.getCreatedAt() == null || !payment.getCreatedAt().plusMinutes(10).isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Giao dịch không còn chờ thu tiền tại quầy.");
        }
        payment.setPaymentStatus("PAID"); payment.setPaymentCompletedAt(LocalDateTime.now());
        payments.save(payment);
        for (BookingPaymentHandler handler : handlers) {
            if (handler.handlePaymentConfirmation(payment, payment.getAmount().doubleValue()) != null) break;
        }
        engagement.audit(Long.valueOf(auth.getName()), "RECEPTIONIST", "CASH_COLLECTED", "paymentId=" + id + ", amount=" + payment.getAmount());
        return payment;
    }
}
