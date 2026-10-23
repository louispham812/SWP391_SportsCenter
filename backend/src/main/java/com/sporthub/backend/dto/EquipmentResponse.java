package com.sporthub.backend.dto;

import java.math.BigDecimal;

public record EquipmentResponse(
        Long itemId,
        String itemName,
        String category,
        BigDecimal rentalPricePerHour,
        Integer totalQuantity,
        Integer availableQuantity,
        String status) {
}
