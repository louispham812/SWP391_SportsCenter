package com.sporthub.backend.dto;

import lombok.Data;

@Data
public class CheckInRequest {
    private Integer memberId;
    private Integer receptionistId;
}