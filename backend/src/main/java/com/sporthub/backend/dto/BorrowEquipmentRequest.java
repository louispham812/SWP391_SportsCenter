package com.sporthub.backend.dto;

public record BorrowEquipmentRequest(
        Long memberId,
        Long itemId,
        Integer quantity) {
}
