package com.sporthub.backend.dto;

import java.util.Map;

public record LeaveDecisionRequest(
        boolean approved,
        Long reassignedCoachId,
        String decisionNote,
        Map<Long, Long> sessionReassignments) {

    public LeaveDecisionRequest(boolean approved, Long reassignedCoachId, String decisionNote) {
        this(approved, reassignedCoachId, decisionNote, null);
    }
}
