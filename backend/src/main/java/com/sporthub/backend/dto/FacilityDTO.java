package com.sporthub.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FacilityDTO {
    private Integer facilityId;
    private String facilityName;
    private Integer sportId;
    private Integer capacity;
    private String status;
}