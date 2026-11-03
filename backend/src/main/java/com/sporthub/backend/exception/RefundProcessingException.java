package com.sporthub.backend.exception;

/**
 * Exception thrown when refund processing fails
 * 
 * Examples:
 * - Refund already processed (idempotency violation)
 * - Invalid refund amount (exceeds original payment)
 * - Missing transaction date for VNPay refund
 * - VNPay refund API error
 * - Database transaction failure during refund
 */
public class RefundProcessingException extends RuntimeException {
    
    private final String refundRequestId;
    private final String errorCode;
    
    public RefundProcessingException(String message) {
        super(message);
        this.refundRequestId = null;
        this.errorCode = null;
    }
    
    public RefundProcessingException(String message, Throwable cause) {
        super(message, cause);
        this.refundRequestId = null;
        this.errorCode = null;
    }
    
    public RefundProcessingException(String refundRequestId, String errorCode, String message) {
        super(String.format("[Refund #%s] Error %s: %s", refundRequestId, errorCode, message));
        this.refundRequestId = refundRequestId;
        this.errorCode = errorCode;
    }
    
    public RefundProcessingException(String refundRequestId, String errorCode, String message, Throwable cause) {
        super(String.format("[Refund #%s] Error %s: %s", refundRequestId, errorCode, message), cause);
        this.refundRequestId = refundRequestId;
        this.errorCode = errorCode;
    }
    
    public String getRefundRequestId() {
        return refundRequestId;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}
