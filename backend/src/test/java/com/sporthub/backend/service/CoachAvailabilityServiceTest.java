package com.sporthub.backend.service;

import com.sporthub.backend.entity.ClassSession;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CoachAvailabilityServiceTest {

    private static ClassSession sessionOn(LocalDate date, int startHour, int endHour, String status) {
        return ClassSession.builder()
                .sessionId(1L)
                .className("Yoga Sáng")
                .sportId(1L)
                .coachId(10L)
                .facilityId(1L)
                .startTime(LocalDateTime.of(date, LocalTime.of(startHour, 0)))
                .endTime(LocalDateTime.of(date, LocalTime.of(endHour, 0)))
                .maxSlots(10)
                .status(status)
                .build();
    }

    @Test
    void turningOffShiftWithFutureScheduledSessionThrowsConflict() {
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        ClassSession futureSession = sessionOn(nextMonday, 9, 11, "SCHEDULED");

        String currentJson = "[{\"day\":\"MONDAY\",\"morning\":true,\"afternoon\":true,\"evening\":true}]";
        String newJson = "[{\"day\":\"MONDAY\",\"morning\":false,\"afternoon\":true,\"evening\":true}]";

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> CoachAvailabilityService.validateUpdateAgainstSessions(
                        currentJson, newJson, List.of(futureSession)));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertNotNull(ex.getReason());
        assertTrue(ex.getReason().contains("Đơn xin nghỉ"), "Expected message to mention Đơn xin nghỉ, got: " + ex.getReason());
    }

    @Test
    void turningOffShiftWithOnlyCancelledOrPastSessionsSucceeds() {
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        LocalDate pastMonday = LocalDate.now().with(TemporalAdjusters.previous(DayOfWeek.MONDAY));

        ClassSession cancelledFuture = sessionOn(nextMonday, 9, 11, "CANCELLED");
        ClassSession completedPast = sessionOn(pastMonday, 9, 11, "SCHEDULED");

        String currentJson = "[{\"day\":\"MONDAY\",\"morning\":true,\"afternoon\":true,\"evening\":true}]";
        String newJson = "[{\"day\":\"MONDAY\",\"morning\":false,\"afternoon\":true,\"evening\":true}]";

        assertDoesNotThrow(() -> CoachAvailabilityService.validateUpdateAgainstSessions(
                currentJson, newJson, List.of(cancelledFuture, completedPast)));
    }

    @Test
    void turningOnAnotherShiftWhenUnrelatedSlotWasAlreadyFalseSucceeds() {
        LocalDate nextMonday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        ClassSession legacyMorningSession = sessionOn(nextMonday, 9, 10, "SCHEDULED");

        // Legacy state already had MONDAY morning = false despite the scheduled session
        String currentJson = "[{\"day\":\"MONDAY\",\"morning\":false,\"afternoon\":false,\"evening\":false}]";
        // Coach turns ON MONDAY afternoon without modifying morning
        String newJson = "[{\"day\":\"MONDAY\",\"morning\":false,\"afternoon\":true,\"evening\":false}]";

        assertDoesNotThrow(() -> CoachAvailabilityService.validateUpdateAgainstSessions(
                currentJson, newJson, List.of(legacyMorningSession)));
    }

    @Test
    void invalidNonArrayJsonThrowsBadRequest() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> CoachAvailabilityService.validateUpdateAgainstSessions(
                        "{}", "{\"day\":\"MONDAY\"}", List.of()));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }
}
