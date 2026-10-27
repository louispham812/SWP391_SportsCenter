package com.sporthub.backend.exception;

import lombok.Getter;

/**
 * Exception thrown when user tries to login with PENDING status (email not verified).
 * Contains email to help frontend redirect to OTP verification page.
 */
@Getter
public class PendingVerificationException extends RuntimeException {
    private final String email;
    
    public PendingVerificationException(String email, String message) {
        super(message);
        this.email = email;
    }
}
