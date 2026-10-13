package com.sporthub.backend.service;

import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BookingServiceTest {

    private final BookingRepository bookingRepository = mock(BookingRepository.class);
    private final ClassSessionRepository classSessionRepository = mock(ClassSessionRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(bookingRepository, classSessionRepository, userRepository);
    }

    @Test
    void createsWaitlistEntryWhenClassIsFull() {
        User member = User.builder().userId(11L).role("MEMBER").status("ACTIVE").build();
        ClassSession session = session(2);
        when(userRepository.findById(11L)).thenReturn(Optional.of(member));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session));
        when(bookingRepository.existsByMemberIdAndSessionIdAndStatusIn(eq(11L), eq(22L), anyList()))
                .thenReturn(false);
        when(bookingRepository.countBySessionIdAndStatusIn(eq(22L), anyList())).thenReturn(2L);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking savedBooking = bookingService.createBooking(11L, 22L);

        assertEquals("WAITLIST", savedBooking.getStatus());
        assertEquals(2, session.getBookedSlots());
        verify(classSessionRepository).save(session);
    }

    @Test
    void rejectsDuplicateActiveBooking() {
        User member = User.builder().userId(11L).role("MEMBER").status("ACTIVE").build();
        when(userRepository.findById(11L)).thenReturn(Optional.of(member));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session(2)));
        when(bookingRepository.existsByMemberIdAndSessionIdAndStatusIn(eq(11L), eq(22L), anyList()))
                .thenReturn(true);

        assertThrows(ResponseStatusException.class, () -> bookingService.createBooking(11L, 22L));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void promotesOldestWaitlistedMemberWhenBookedPlaceIsCancelled() {
        Booking currentBooking = Booking.builder()
                .bookingId(31L)
                .memberId(11L)
                .sessionId(22L)
                .status("BOOKED")
                .build();
        Booking waitlisted = Booking.builder()
                .bookingId(32L)
                .memberId(12L)
                .sessionId(22L)
                .status("WAITLIST")
                .build();
        ClassSession session = session(2);
        when(bookingRepository.findById(31L)).thenReturn(Optional.of(currentBooking));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session));
        when(bookingRepository.findBySessionIdAndStatusInOrderByBookingTimeAsc(22L, List.of("WAITLIST")))
                .thenReturn(List.of(waitlisted));
        when(bookingRepository.countBySessionIdAndStatusIn(eq(22L), anyList())).thenReturn(1L);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Booking cancelled = bookingService.cancelBooking(31L, 11L);

        assertEquals("CANCELLED", cancelled.getStatus());
        assertEquals("BOOKED", waitlisted.getStatus());
        assertEquals(1, session.getBookedSlots());
    }

    private ClassSession session(int maxSlots) {
        return ClassSession.builder()
                .sessionId(22L)
                .startTime(LocalDateTime.now().plusHours(5))
                .endTime(LocalDateTime.now().plusHours(6))
                .maxSlots(maxSlots)
                .bookedSlots(0)
                .status("SCHEDULED")
                .build();
    }
}
