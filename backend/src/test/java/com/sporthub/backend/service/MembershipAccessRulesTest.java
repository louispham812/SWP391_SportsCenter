package com.sporthub.backend.service;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

class MembershipAccessRulesTest {
    @Test void silverAllowsOnlyCompleteBookingsInsideOffPeakHours() {
        var start = LocalDateTime.of(2026, 11, 19, 8, 0);
        assertTrue(MembershipAccessRules.permits("OFF_PEAK", start, start.withHour(16)));
        assertFalse(MembershipAccessRules.permits("OFF_PEAK", start.minusMinutes(1), start.plusHours(1)));
        assertFalse(MembershipAccessRules.permits("OFF_PEAK", start.withHour(15), start.withHour(16).plusMinutes(1)));
        assertFalse(MembershipAccessRules.permits("OFF_PEAK", start, start.plusDays(1)));
    }
    @Test void fullDayAllowsEveningAndRejectsInvalidIntervals() {
        var start = LocalDateTime.of(2026, 11, 19, 18, 0);
        assertTrue(MembershipAccessRules.permits("ALL_DAY", start, start.plusHours(2)));
        assertFalse(MembershipAccessRules.permits("ALL_DAY", start, start));
        assertFalse(MembershipAccessRules.permits("ALL_DAY", null, start));
    }
}
