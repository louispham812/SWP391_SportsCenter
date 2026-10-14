package com.sporthub.backend.dto;

public record ManagerFacilityResponse(
        Long facilityId,
        String facilityName,
        Long sportId,
        String sportName,
        Integer capacity,
        String status) {
}
