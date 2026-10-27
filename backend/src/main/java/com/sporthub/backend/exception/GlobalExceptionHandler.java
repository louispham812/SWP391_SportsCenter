package com.sporthub.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Global exception handler để format error responses một cách consistent
 * và đảm bảo message từ ResponseStatusException được trả về client
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle ResponseStatusException và trả về JSON response với message đầy đủ
     * 
     * Format:
     * {
     *   "timestamp": "2024-10-25T17:10:00",
     *   "status": 409,
     *   "error": "Conflict",
     *   "message": "Email đã được sử dụng bởi Hạo Đức (MEMBER).",
     *   "path": "/api/v1/receptionist/users"
     * }
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", ex.getStatusCode().value());
        body.put("error", ex.getStatusCode().toString().replace(String.valueOf(ex.getStatusCode().value()) + " ", ""));
        body.put("message", ex.getReason()); // This is the key fix!
        
        return new ResponseEntity<>(body, ex.getStatusCode());
    }

    /**
     * Handle PendingVerificationException (for login flow)
     */
    @ExceptionHandler(PendingVerificationException.class)
    public ResponseEntity<Map<String, Object>> handlePendingVerificationException(PendingVerificationException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "PENDING_VERIFICATION");
        body.put("email", ex.getEmail());
        body.put("message", ex.getMessage());
        body.put("redirectTo", "/verify-otp");
        
        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }

    /**
     * Handle generic IllegalArgumentException (từ AuthService.register, etc.)
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", 400);
        body.put("error", "Bad Request");
        body.put("message", ex.getMessage());
        
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle generic RuntimeException
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", 400);
        body.put("error", "Bad Request");
        body.put("message", ex.getMessage());
        
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
}
