package com.sporthub.backend.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.service.gateway.PaymentGateway;

/**
 * Payment Gateway Controller
 * 
 * Unified endpoint for generating payment URLs.
 * 
 * Current Implementation:
 * - VNPAY: Redirect to VNPay Sandbox payment page
 * 
 * Endpoint:
 * GET /api/v1/payments/generate?paymentId={id}&gateway=VNPAY
 */
@RestController
@RequestMapping("/api/v1/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final PaymentGateway vnpayGateway;
    @Autowired private com.sporthub.backend.service.PaymentAttemptService attempts;

    @Autowired
    public PaymentController(
            PaymentTransactionRepository paymentTransactionRepository,
            @Qualifier("vnpayGateway") PaymentGateway vnpayGateway) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.vnpayGateway = vnpayGateway;
    }
    
    /**
     * Generate payment URL for VNPay gateway
     * 
     * @param paymentId Payment transaction ID
     * @param amount Payment amount (optional, will use from payment record)
     * @param gateway Gateway type (VNPAY only)
     * @param request HttpServletRequest to extract client IP
     * @return Payment URL
     */
    @GetMapping("/generate")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> generatePayment(
            @RequestParam Long paymentId,
            @RequestParam(required = false) Double amount,
            @RequestParam(defaultValue = "VNPAY") String gateway,
            jakarta.servlet.http.HttpServletRequest request, org.springframework.security.core.Authentication auth) {
        
        // Only VNPAY gateway supported
        if (!"VNPAY".equalsIgnoreCase(gateway)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Only VNPAY gateway is supported");
        }
        
        PaymentTransaction payment = paymentTransactionRepository.findByIdForUpdate(paymentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        authorize(payment, auth); requirePayable(payment);
        return ResponseEntity.ok(attempts.generate(payment, vnpayGateway, getClientIpAddress(request)));
    }
    
    /**
     * Extract client IP address from request
     * Force IPv4 format for VNPay compatibility
     */
    private String getClientIpAddress(jakarta.servlet.http.HttpServletRequest request) {
        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        // If multiple IPs in X-Forwarded-For, take the first one
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }
        
        // Convert IPv6 localhost to IPv4 for VNPay
        if (ipAddress != null && (ipAddress.equals("0:0:0:0:0:0:0:1") || ipAddress.equals("::1"))) {
            ipAddress = "127.0.0.1";
        }
        
        return ipAddress != null ? ipAddress : "127.0.0.1";
    }

    /**
     * Get payment status for polling (used by VNPay return page)
     * 
     * @param paymentId Payment ID from booking confirmation
     * @return Payment status details
     */
    @GetMapping("/{paymentId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable Long paymentId, org.springframework.security.core.Authentication auth) {
        PaymentTransaction payment = paymentTransactionRepository
            .findById(paymentId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Payment not found"));
        
        authorize(payment, auth);
        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", payment.getPaymentId());
        response.put("paymentStatus", payment.getPaymentStatus());
        response.put("amount", payment.getAmount());
        response.put("paymentMethod", payment.getPaymentMethod());
        response.put("referenceCode", payment.getReferenceCode());
        response.put("createdAt", payment.getCreatedAt());
        
        return ResponseEntity.ok(response);
    }
    private void authorize(PaymentTransaction payment, org.springframework.security.core.Authentication auth) {
        if (auth == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        boolean staff = auth.getAuthorities().stream().anyMatch(a -> java.util.Set.of("ROLE_RECEPTIONIST", "ROLE_MANAGER", "ROLE_ADMIN").contains(a.getAuthority()));
        if (!staff && !payment.getMemberId().toString().equals(auth.getName())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    private void requirePayable(PaymentTransaction payment) {
        if (!"PENDING".equals(payment.getPaymentStatus()) || payment.getAmount().signum() <= 0
                || payment.getCreatedAt() == null || !payment.getCreatedAt().plusMinutes(10).isAfter(java.time.LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Giao dịch không còn trong thời hạn thanh toán.");
        }
    }

}
