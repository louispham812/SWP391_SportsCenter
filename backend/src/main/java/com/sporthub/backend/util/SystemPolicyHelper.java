package com.sporthub.backend.util;

import com.sporthub.backend.entity.SystemSetting;
import com.sporthub.backend.repository.SystemSettingRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Reads runtime operational policies stored under {@code SYSTEM_POLICIES} in {@code system_settings}
 * with deterministic safe defaults when unset or when {@code SystemSettingRepository} is absent in unit tests.
 */
public final class SystemPolicyHelper {

    public static final String KEY_SYSTEM_POLICIES = "SYSTEM_POLICIES";
    public static final int DEFAULT_HOLD_TIMEOUT_MINUTES = 10;
    public static final int DEFAULT_CANCEL_REFUND_DEADLINE_HOURS = 2;
    public static final int DEFAULT_COACH_COMMISSION_PERCENT = 40;
    public static final int DEFAULT_MAX_ADVANCE_BOOKING_DAYS = 14;
    public static final BigDecimal DEFAULT_PT_HOURLY_RATE = BigDecimal.valueOf(250000);

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private SystemPolicyHelper() {
    }

    public static int bookingHoldTimeoutMinutes(SystemSettingRepository repo) {
        return readPositiveInt(repo, "bookingHoldTimeoutMinutes", DEFAULT_HOLD_TIMEOUT_MINUTES, 1, 120);
    }

    public static int cancelRefundDeadlineHours(SystemSettingRepository repo) {
        return readPositiveInt(repo, "cancelRefundDeadlineHours", DEFAULT_CANCEL_REFUND_DEADLINE_HOURS, 1, 168);
    }

    public static int coachCommissionPercent(SystemSettingRepository repo) {
        return readPositiveInt(repo, "coachCommissionPercent", DEFAULT_COACH_COMMISSION_PERCENT, 1, 100);
    }

    public static int maxAdvanceBookingDays(SystemSettingRepository repo) {
        return readPositiveInt(repo, "maxAdvanceBookingDays", DEFAULT_MAX_ADVANCE_BOOKING_DAYS, 1, 365);
    }

    public static BigDecimal ptHourlyRate(SystemSettingRepository repo) {
        int val = readPositiveInt(repo, "ptHourlyRate", DEFAULT_PT_HOURLY_RATE.intValue(), 50000, 10000000);
        return BigDecimal.valueOf(val);
    }

    private static int readPositiveInt(SystemSettingRepository repo, String field, int fallback, int min, int max) {
        if (repo == null) {
            return fallback;
        }
        try {
            Optional<SystemSetting> setting = repo.findById(KEY_SYSTEM_POLICIES);
            if (setting.isEmpty() || setting.get().getSettingValue() == null || setting.get().getSettingValue().isBlank()) {
                return fallback;
            }
            JsonNode node = MAPPER.readTree(setting.get().getSettingValue());
            if (node == null || !node.has(field) || node.get(field).isNull()) {
                return fallback;
            }
            int parsed = node.get(field).asInt(fallback);
            if (parsed < min || parsed > max) {
                return fallback;
            }
            return parsed;
        } catch (Exception ignored) {
            return fallback;
        }
    }
}
