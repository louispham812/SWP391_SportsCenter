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
    public ResponseEntity<?> generatePayment(
            @RequestParam Long paymentId,
            @RequestParam(required = false) Double amount,
            @RequestParam(defaultValue = "VNPAY") String gateway,
            jakarta.servlet.http.HttpServletRequest request) {
        
        // Only VNPAY gateway supported
        if (!"VNPAY".equalsIgnoreCase(gateway)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Only VNPAY gateway is supported");
        }
        
        PaymentTransaction payment = paymentTransactionRepository
            .findById(paymentId)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Payment not found"));
        
        String description = "Thanh toan " + payment.getBookingType() + " #" + payment.getReferenceCode();
        
        // Extract client IP address
        String ipAddress = getClientIpAddress(request);
        
        Map<String, Object> response = vnpayGateway.generatePayment(
            paymentId, 
            payment.getAmount(), 
            description,
            ipAddress
        );
        
        // Add bookingType to response for frontend navigation
        response.put("bookingType", payment.getBookingType());
        
        return ResponseEntity.ok(response);
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
