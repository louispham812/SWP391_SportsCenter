package com.sporthub.backend.service;

import static org.mockito.Mockito.lenient;
import com.sporthub.backend.dto.CheckInRequest;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class CheckInServiceTest {
    private final MemberCheckInRepository entries = mock(MemberCheckInRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final BookingRepository classes = mock(BookingRepository.class);
    private final CourtBookingRepository courts = mock(CourtBookingRepository.class);
    private final MembershipService memberships = mock(MembershipService.class);
    private final CheckInService service = new CheckInService(entries, users, classes, courts, memberships);

    @org.junit.jupiter.api.BeforeEach
    void activeMember() {
        var eligibility = mock(CheckInEligibilityService.class);
        org.springframework.test.util.ReflectionTestUtils.setField(service, "eligibility", eligibility);
        when(eligibility.validateCourt(any(), any(), any())).thenAnswer(i -> i.getArgument(0));
        when(users.findByIdForUpdate(11L)).thenReturn(Optional.of(User.builder().userId(11L).role("MEMBER").status("ACTIVE").build()));
    }
    @Test
    void rejectsMemberWithoutTodaysConfirmedBookingWithoutRecordingSuccess() {
        CheckInRequest request = new CheckInRequest();
        request.setMemberId(11);
        lenient().when(users.findById(11L)).thenReturn(Optional.of(User.builder().userId(11L).build()));
        lenient().when(users.findByIdForUpdate(11L)).thenReturn(Optional.of(User.builder().userId(11L).build()));
        when(courts.findCheckInEligibleBookings(eq(11L), any(), any(), any())).thenReturn(List.of());
        assertThrows(ResponseStatusException.class, () -> service.processCheckIn(request));
        verify(entries, never()).save(any());
    }

    @Test
    void checksInNextCourtAndConsumesHeldQuotaOnlyOnce() {
        CourtBooking first = court(1L, LocalDateTime.now().minusMinutes(5));
        first.setUsesMembershipQuota(true);
        first.setMembershipId(55L);
        first.setQuotaHoursUsed(new BigDecimal("1.5"));
        CourtBooking later = court(2L, first.getStartTime().plusHours(3));
        when(courts.findCheckInEligibleBookings(eq(11L), any(), any(), any())).thenReturn(List.of(first, later));
        service.checkInBooking(11L, 1L);
        assertEquals("CHECKED_IN", first.getStatus());
        assertEquals("CONFIRMED", later.getStatus());
        verify(memberships).consumeCourtQuota(55L, 1.5);
        verify(courts).save(first);
        verify(courts, never()).save(later);
    }

    @Test
    void rejectsDuplicateScanWithoutChangingBookingOrQuota() {
        CourtBooking booking = court(1L, LocalDateTime.now().plusHours(1));
        when(courts.findCheckInEligibleBookings(eq(11L), any(), any(), any())).thenReturn(List.of(booking));
        when(entries.existsByMemberIdAndCheckedInAtAfter(eq(11L), any())).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> service.checkInBooking(11L));
        assertEquals("CONFIRMED", booking.getStatus());
        verify(courts, never()).save(any());
        verifyNoInteractions(memberships);
    }

    @Test
    void allowsConfirmedClassTodayWithoutCourtBooking() {
        when(courts.findCheckInEligibleBookings(eq(11L), any(), any(), any())).thenReturn(List.of());
        when(classes.findCheckInEligibleClasses(eq(11L), any())).thenReturn(List.of(Booking.builder().bookingId(4L).memberId(11L).status("CONFIRMED").build()));
        assertDoesNotThrow(() -> service.checkInBooking(11L));
        verifyNoInteractions(memberships);
    }

    private CourtBooking court(Long id, LocalDateTime start) {
        CourtBooking b = new CourtBooking();
        b.setCourtBookingId(id);
        b.setStartTime(start);
        b.setEndTime(start.plusHours(1));
        b.setStatus("CONFIRMED");
        return b;
    }
}
