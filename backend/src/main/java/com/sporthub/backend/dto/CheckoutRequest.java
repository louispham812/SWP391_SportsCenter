package com.sporthub.backend.dto;

import java.time.LocalDateTime;

public record CheckoutRequest(
        String bookingType,
        Long itemId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String paymentMethod) {
}
