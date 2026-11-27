package com.sporthub.backend.dto;

public record FacilityRequest(
        String facilityName,
        Long sportId,
        Integer capacity
) {}
