package com.sporthub.backend.controller;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.sporthub.backend.constants.PaymentConstants;
import com.sporthub.backend.dto.PaymentConfirmationResult;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.service.gateway.VNPayGateway;
import com.sporthub.backend.service.payment.BookingPaymentHandler;

/**
 * VNPay IPN (Instant Payment Notification) Handler
 * 
 * Receives webhook from VNPay when payment is completed
 * 
 * Flow:
 * 1. User completes payment on VNPay
 * 2. VNPay calls this IPN endpoint
 * 3. Verify vnp_SecureHash signature
 * 4. Verify vnp_ResponseCode = "00" (success)
 * 5. Verify amount matches payment record
 * 6. Update payment status to PAID
 * 7. Process booking confirmation via Strategy Pattern
 * 8. Return RspCode to VNPay
 * 
 * Security:
 * - HMAC SHA512 signature verification
 * - Amount verification
 * - Idempotency check
 * - Audit logging
 */
@RestController
@RequestMapping("/api/v1/webhooks/vnpay")
@CrossOrigin(origins = "*")
public class VNPayWebhookController {
    
    private static final Logger logger = LoggerFactory.getLogger(VNPayWebhookController.class);
    
    private final VNPayGateway vnpayGateway;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final List<BookingPaymentHandler> paymentHandlers;
    
    @Autowired
    public VNPayWebhookController(
            VNPayGateway vnpayGateway,
            PaymentTransactionRepository paymentTransactionRepository,
            List<BookingPaymentHandler> paymentHandlers) {
        this.vnpayGateway = vnpayGateway;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.paymentHandlers = paymentHandlers;
    }
    
    /**
     * VNPay Return URL endpoint
     * 
     * Called by frontend when user returns from VNPay
     * Verifies payment and updates booking status
     * 
     * @param params All query parameters from VNPay
     * @return Payment verification result
     */
    @GetMapping("/return")
    @Transactional
    public ResponseEntity<?> handleReturn(@RequestParam Map<String, String> params) {
        logger.info("VNPay Return URL called: {}", params);
        
        String vnpResponseCode = params.get("vnp_ResponseCode");
        String vnpTransactionNo = params.get("vnp_TransactionNo");
        
        Map<String, Object> response = new HashMap<>();
        
        // Verify payment using common logic
        Map<String, Object> verifyResult = verifyPayment(params);
        
        if (!(Boolean) verifyResult.get("valid")) {
            // Handle already paid case (not an error for return URL)
            if (verifyResult.containsKey("alreadyPaid") && (Boolean) verifyResult.get("alreadyPaid")) {
                response.put("success", true);
                response.put("message", "Giao dịch đã được xác nhận");
                return ResponseEntity.ok(response);
            }
            
            // Other errors
            response.put("success", false);
            response.put("message", verifyResult.get("error"));
            return ResponseEntity.ok(response);
        }
        
        PaymentTransaction payment = (PaymentTransaction) verifyResult.get("payment");
        Long paymentId = payment.getPaymentId();
        
        // Check VNPay response code
        if (!"00".equals(vnpResponseCode)) {
            logger.warn("VNPay payment failed for payment {}: code {}", paymentId, vnpResponseCode);
            payment.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_FAILED);
            paymentTransactionRepository.save(payment);
            response.put("success", false);
            response.put("message", "Thanh toán thất bại");
            return ResponseEntity.ok(response);
        }
        
        // Update payment status to PAID
        payment.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_PAID);
        payment.setPaymentMethod(PaymentConstants.METHOD_VNPAY);
        payment.setReferenceCode(vnpTransactionNo);
        payment.setTransactionDate(params.get("vnp_PayDate")); // Save VNPay transaction date for refund API
        payment.setPaymentCompletedAt(java.time.LocalDateTime.now()); // Set completion time for 2-hour refund window
        paymentTransactionRepository.save(payment);
        
        logger.info("VNPay payment successful: payment={}, vnpTxn={}", paymentId, vnpTransactionNo);
        
        // Process booking confirmation
        PaymentConfirmationResult confirmationResult = null;
        for (BookingPaymentHandler handler : paymentHandlers) {
            PaymentConfirmationResult result = handler.handlePaymentConfirmation(
                    payment, 
                    payment.getAmount().doubleValue()
            );
            if (result != null) {
                confirmationResult = result;
                logger.info("Booking confirmed for payment {}: {}", paymentId, result.getBookingType());
                break;
            }
        }
        
        response.put("success", true);
        response.put("message", confirmationResult != null ? 
                "Thanh toán thành công! Đơn hàng đã được xác nhận." :
                "Thanh toán thành công! Đơn hàng đang được xử lý.");
        response.put("paymentId", paymentId);
        
        if (confirmationResult != null) {
            if (confirmationResult.getBookingId() != null) {
                response.put("bookingId", confirmationResult.getBookingId());
            }
            if (confirmationResult.getMembershipId() != null) {
                response.put("membershipId", confirmationResult.getMembershipId());
            }
            response.put("bookingType", confirmationResult.getBookingType());
            response.put("status", confirmationResult.getStatus());
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * VNPay IPN endpoint
     * 
     * @param params All query parameters from VNPay
     * @return IPN response with RspCode
     */
    @GetMapping("/ipn")
    public ResponseEntity<?> handleIPN(@RequestParam Map<String, String> params) {
        logger.info("VNPay IPN received: {}", params);
        
        String vnpResponseCode = params.get("vnp_ResponseCode");
        String vnpTransactionNo = params.get("vnp_TransactionNo");
        
        // Verify payment using common logic
        Map<String, Object> verifyResult = verifyPayment(params);
        
        if (!(Boolean) verifyResult.get("valid")) {
            // Handle already paid case (still return success to VNPay)
            if (verifyResult.containsKey("alreadyPaid") && (Boolean) verifyResult.get("alreadyPaid")) {
                return ResponseEntity.ok(buildIPNResponse("00", "Order already confirmed"));
            }
            
            // Other errors - return specific error code
            String errorCode = (String) verifyResult.get("errorCode");
            String errorMessage = (String) verifyResult.get("error");
            return ResponseEntity.ok(buildIPNResponse(errorCode, errorMessage));
        }
        
        PaymentTransaction payment = (PaymentTransaction) verifyResult.get("payment");
        Long paymentId = payment.getPaymentId();
        
        // Check VNPay response code
        if (!"00".equals(vnpResponseCode)) {
            logger.warn("VNPay payment failed for payment {}: code {}", paymentId, vnpResponseCode);
            payment.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_FAILED);
            paymentTransactionRepository.save(payment);
            return ResponseEntity.ok(buildIPNResponse("00", "Confirmed"));
        }
        
        // Update payment status to PAID
        payment.setPaymentStatus(PaymentConstants.PAYMENT_STATUS_PAID);
        payment.setPaymentMethod(PaymentConstants.METHOD_VNPAY);
        payment.setReferenceCode(vnpTransactionNo);
        payment.setTransactionDate(params.get("vnp_PayDate")); // Save VNPay transaction date for refund API
        payment.setPaymentCompletedAt(java.time.LocalDateTime.now()); // Set completion time for 2-hour refund window
        paymentTransactionRepository.save(payment);
        
        logger.info("VNPay payment successful: payment={}, vnpTxn={}", paymentId, vnpTransactionNo);
        
        // Use Strategy Pattern to handle booking confirmation
        for (BookingPaymentHandler handler : paymentHandlers) {
            PaymentConfirmationResult result = handler.handlePaymentConfirmation(
                    payment, 
                    payment.getAmount().doubleValue()
            );
            if (result != null) {
                logger.info("Booking confirmed for payment {}: {}", paymentId, result.getBookingType());
                return ResponseEntity.ok(buildIPNResponse("00", "Confirmed"));
            }
        }
        
        logger.warn("Payment {} updated but no linked booking found", paymentId);
        return ResponseEntity.ok(buildIPNResponse("00", "Confirmed"));
    }
    
    /**
     * Verify payment from VNPay webhook parameters
     * 
     * Common verification logic for both /return and /ipn endpoints:
     * - Signature validation
     * - Payment ID parsing
     * - Payment existence check
     * - Idempotency check
     * - Amount verification
     * 
     * @param params VNPay webhook parameters
     * @return Map with verification result: {valid: boolean, payment: PaymentTransaction, error: String, errorCode: String}
     */
    private Map<String, Object> verifyPayment(Map<String, String> params) {
        Map<String, Object> result = new HashMap<>();
        
        String vnpSecureHash = params.get("vnp_SecureHash");
        String vnpTxnRef = params.get("vnp_TxnRef");
        String vnpAmount = params.get("vnp_Amount");
        
        // 1. Verify signature
        if (!vnpayGateway.verifySignature(params, vnpSecureHash)) {
            logger.error("Invalid VNPay signature for payment: {}", vnpTxnRef);
            result.put("valid", false);
            result.put("error", "Invalid signature");
            result.put("errorCode", "97");
            return result;
        }
        
        // 2. Parse payment ID (supports unique suffixes like paymentId_timestamp)
        Long paymentId;
        try {
            String idStr = vnpTxnRef;
            if (idStr != null && idStr.contains("_")) {
                idStr = idStr.split("_")[0];
            }
            paymentId = Long.parseLong(idStr);
        } catch (NumberFormatException e) {
            logger.error("Invalid payment ID format: {}", vnpTxnRef);
            result.put("valid", false);
            result.put("error", "Invalid payment ID");
            result.put("errorCode", "02");
            return result;
        }
        
        // 3. Find payment transaction
        PaymentTransaction payment = paymentTransactionRepository
                .findById(paymentId)
                .orElse(null);
        
        if (payment == null) {
            logger.error("Payment not found: {}", paymentId);
            result.put("valid", false);
            result.put("error", "Order not found");
            result.put("errorCode", "01");
            return result;
        }
        
        // 4. Idempotency check
        if (PaymentConstants.PAYMENT_STATUS_PAID.equals(payment.getPaymentStatus())) {
            logger.info("Payment {} already paid", paymentId);
            result.put("valid", false);
            result.put("error", "Order already confirmed");
            result.put("errorCode", "00"); // Still success code
            result.put("alreadyPaid", true);
            return result;
        }
        
        // 5. Amount verification
        BigDecimal expectedAmount = payment.getAmount().multiply(new BigDecimal(100));
        BigDecimal receivedAmount = new BigDecimal(vnpAmount);
        
        if (expectedAmount.compareTo(receivedAmount) != 0) {
            logger.error("Amount mismatch for payment {}: expected {}, received {}", 
                    paymentId, expectedAmount, receivedAmount);
            result.put("valid", false);
            result.put("error", "Invalid amount");
            result.put("errorCode", "04");
            return result;
        }
        
        // All checks passed
        result.put("valid", true);
        result.put("payment", payment);
        return result;
    }
    
    /**
     * Build IPN response for VNPay
     * 
     * @param rspCode Response code (00 = success, 97 = invalid signature, etc.)
     * @param message Response message
     * @return IPN response map
     */
    private Map<String, Object> buildIPNResponse(String rspCode, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("RspCode", rspCode);
        response.put("Message", message);
        return response;
    }
}
