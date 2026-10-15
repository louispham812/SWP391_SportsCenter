package com.sporthub.backend.dto; 

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacilityDTO {
    private Long facilityId;
    private String facilityName;
    private Long sportId;
    private String sportName;
    private Integer capacity;
    private String status;
}