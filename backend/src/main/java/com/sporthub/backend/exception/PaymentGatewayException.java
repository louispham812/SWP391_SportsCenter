package com.sporthub.backend.exception;

/**
 * Exception thrown when payment gateway operations fail
 * 
 * Examples:
 * - Invalid signature from VNPay
 * - Network errors calling VNPay API
 * - Invalid response format from VNPay
 * - Payment gateway timeout
 */
public class PaymentGatewayException extends RuntimeException {
    
    private final String gatewayName;
    private final String errorCode;
    
    public PaymentGatewayException(String message) {
        super(message);
        this.gatewayName = null;
        this.errorCode = null;
    }
    
    public PaymentGatewayException(String message, Throwable cause) {
        super(message, cause);
        this.gatewayName = null;
        this.errorCode = null;
    }
    
    public PaymentGatewayException(String gatewayName, String errorCode, String message) {
        super(String.format("[%s] Error %s: %s", gatewayName, errorCode, message));
        this.gatewayName = gatewayName;
        this.errorCode = errorCode;
    }
    
    public PaymentGatewayException(String gatewayName, String errorCode, String message, Throwable cause) {
        super(String.format("[%s] Error %s: %s", gatewayName, errorCode, message), cause);
        this.gatewayName = gatewayName;
        this.errorCode = errorCode;
    }
    
    public String getGatewayName() {
        return gatewayName;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}
