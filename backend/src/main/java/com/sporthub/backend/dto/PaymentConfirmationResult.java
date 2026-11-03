package com.sporthub.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Result DTO for payment confirmation
 * Replaces generic Map<String, Object> for type safety
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentConfirmationResult {
    private boolean success;
    private Long paymentId;
    private String bookingType;
    private Long bookingId;
    private Long membershipId;
    private String status;
    private String message;
}
