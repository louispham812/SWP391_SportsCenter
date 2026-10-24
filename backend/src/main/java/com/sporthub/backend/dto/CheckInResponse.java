package com.sporthub.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CheckInResponse {
    private Long checkInId;
    private Long memberId; 
    private String memberName;
    private String status; // 'VALID' hoặc 'REJECTED'
    private String message;
    private LocalDateTime checkedInAt;
}