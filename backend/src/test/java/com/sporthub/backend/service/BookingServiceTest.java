package com.sporthub.backend.service;

import com.sporthub.backend.dto.BookingConfirmationResponse;
import com.sporthub.backend.dto.CheckoutRequest;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.CourtBooking;
import com.sporthub.backend.entity.PaymentTransaction;
import com.sporthub.backend.entity.PublicFacility;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.entity.SportsCourt;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.PublicFacilityRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.SportsCourtRepository;
import com.sporthub.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
    private final PublicSportRepository publicSportRepository = mock(PublicSportRepository.class);
    private final PublicFacilityRepository publicFacilityRepository = mock(PublicFacilityRepository.class);
    private final SportsCourtRepository sportsCourtRepository = mock(SportsCourtRepository.class);
    private final CourtBookingRepository courtBookingRepository = mock(CourtBookingRepository.class);
    private final PaymentTransactionRepository paymentTransactionRepository = mock(PaymentTransactionRepository.class);
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(
                bookingRepository,
                classSessionRepository,
                userRepository,
                publicSportRepository,
                publicFacilityRepository,
                sportsCourtRepository,
                courtBookingRepository,
                paymentTransactionRepository);
    }

    @Test
    void classCheckoutCreatesPaidBookingAndStoresPrice() {
        ClassSession session = session(2);
        User member = User.builder().userId(11L).role("MEMBER").status("ACTIVE").build();
        PublicSport sport = sport(4L, "Pickleball");
        PublicFacility facility = facility(5L, "Court hall");
        User coach = User.builder().userId(8L).fullName("Coach").build();
        when(userRepository.findById(11L)).thenReturn(Optional.of(member));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session));
        when(bookingRepository.existsByMemberIdAndSessionIdAndStatusIn(eq(11L), eq(22L), anyList()))
                .thenReturn(false);
        when(bookingRepository.countBySessionIdAndStatusIn(eq(22L), anyList())).thenReturn(0L, 1L);
        when(publicSportRepository.findById(4L)).thenReturn(Optional.of(sport));
        when(publicFacilityRepository.findById(5L)).thenReturn(Optional.of(facility));
        when(userRepository.findById(8L)).thenReturn(Optional.of(coach));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction payment = invocation.getArgument(0);
            payment.setPaymentId(77L);
            return payment;
        });
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setBookingId(88L);
            return booking;
        });

        BookingConfirmationResponse response = bookingService.checkout(
                11L,
                new CheckoutRequest("CLASS", 22L, null, null, "SANDBOX"));

        assertEquals("CLASS", response.bookingType());
        assertEquals(88L, response.bookingId());
        assertEquals(new BigDecimal("275000"), response.amountPaid());
        assertEquals("PAID", response.paymentStatus());
        verify(classSessionRepository).save(session);
        verify(paymentTransactionRepository).save(any(PaymentTransaction.class));
    }

    @Test
    void classCheckoutRejectsFullClassWithoutCreatingPayment() {
        ClassSession session = session(1);
        when(userRepository.findById(11L))
                .thenReturn(Optional.of(User.builder().userId(11L).role("MEMBER").status("ACTIVE").build()));
        when(classSessionRepository.findByIdForUpdate(22L)).thenReturn(Optional.of(session));
        when(bookingRepository.countBySessionIdAndStatusIn(eq(22L), anyList())).thenReturn(1L);

        assertThrows(ResponseStatusException.class, () -> bookingService.checkout(
                11L,
                new CheckoutRequest("CLASS", 22L, null, null, "SANDBOX")));
        verify(paymentTransactionRepository, never()).save(any(PaymentTransaction.class));
    }

    @Test
    void courtCheckoutCreatesPaidHourlyReservation() {
        SportsCourt court = court();
        User member = User.builder().userId(11L).role("MEMBER").status("ACTIVE").build();
        LocalDateTime start = LocalDate.now().plusDays(1).atTime(10, 0);
        LocalDateTime end = start.plusHours(1);
        when(userRepository.findById(11L)).thenReturn(Optional.of(member));
        when(sportsCourtRepository.findByIdForUpdate(33L)).thenReturn(Optional.of(court));
        when(courtBookingRepository.existsConfirmedOverlap(33L, start, end)).thenReturn(false);
        when(publicSportRepository.findById(4L)).thenReturn(Optional.of(sport(4L, "Pickleball")));
        when(paymentTransactionRepository.save(any(PaymentTransaction.class))).thenAnswer(invocation -> {
            PaymentTransaction payment = invocation.getArgument(0);
            payment.setPaymentId(77L);
            return payment;
        });
        when(courtBookingRepository.save(any())).thenAnswer(invocation -> {
            var booking = invocation.getArgument(0, com.sporthub.backend.entity.CourtBooking.class);
            booking.setCourtBookingId(99L);
            return booking;
        });

        BookingConfirmationResponse response = bookingService.checkout(
                11L,
                new CheckoutRequest("COURT", 33L, start, end, "SANDBOX"));

        assertEquals(99L, response.bookingId());
        assertEquals(new BigDecimal("180000"), response.amountPaid());
        assertEquals("PAID", response.paymentStatus());
    }

    @Test
    void quoteRejectsCourtSlotThatIsNotOneHour() {
        SportsCourt court = court();
        when(sportsCourtRepository.findById(33L)).thenReturn(Optional.of(court));
        LocalDateTime start = LocalDate.now().plusDays(1).atTime(10, 0);

        assertThrows(ResponseStatusException.class, () -> bookingService.getQuote(
                "COURT", 33L, start, start.plusMinutes(30)));
    }

    @Test
    void memberCanCancelTheirCourtBookingMoreThanTwoHoursBeforeStart() {
        CourtBooking booking = courtBooking(11L, LocalDateTime.now().plusDays(1));
        when(courtBookingRepository.findByIdForUpdate(99L)).thenReturn(Optional.of(booking));
        when(courtBookingRepository.save(booking)).thenReturn(booking);

        CourtBooking cancelled = bookingService.cancelCourtBooking(99L, 11L);

        assertEquals("CANCELLED", cancelled.getStatus());
        verify(courtBookingRepository).save(booking);
    }

    @Test
    void memberCannotCancelAnotherMembersCourtBooking() {
        CourtBooking booking = courtBooking(12L, LocalDateTime.now().plusDays(1));
        when(courtBookingRepository.findByIdForUpdate(99L)).thenReturn(Optional.of(booking));

        assertThrows(ResponseStatusException.class, () -> bookingService.cancelCourtBooking(99L, 11L));
        verify(courtBookingRepository, never()).save(any(CourtBooking.class));
    }

    @Test
    void memberCannotCancelCourtBookingWithinTwoHoursOfStart() {
        CourtBooking booking = courtBooking(11L, LocalDateTime.now().plusMinutes(90));
        when(courtBookingRepository.findByIdForUpdate(99L)).thenReturn(Optional.of(booking));

        assertThrows(ResponseStatusException.class, () -> bookingService.cancelCourtBooking(99L, 11L));
        verify(courtBookingRepository, never()).save(any(CourtBooking.class));
    }

    private CourtBooking courtBooking(Long memberId, LocalDateTime startTime) {
        CourtBooking booking = new CourtBooking();
        booking.setCourtBookingId(99L);
        booking.setMemberId(memberId);
        booking.setStartTime(startTime);
        booking.setEndTime(startTime.plusHours(1));
        booking.setStatus("CONFIRMED");
        return booking;
    }

    private ClassSession session(int maxSlots) {
        return ClassSession.builder()
                .sessionId(22L)
                .className("Class session")
                .sportId(4L)
                .coachId(8L)
                .facilityId(5L)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusHours(1))
                .maxSlots(maxSlots)
                .bookedSlots(0)
                .priceAmount(new BigDecimal("275000"))
                .status("SCHEDULED")
                .build();
    }

    private PublicSport sport(Long id, String name) {
        PublicSport sport = new PublicSport();
        sport.setSportId(id);
        sport.setName(name);
        sport.setActive(true);
        return sport;
    }

    private PublicFacility facility(Long id, String name) {
        PublicFacility facility = new PublicFacility();
        facility.setFacilityId(id);
        facility.setName(name);
        return facility;
    }

    private SportsCourt court() {
        SportsCourt court = new SportsCourt();
        court.setCourtId(33L);
        court.setSportId(4L);
        court.setCourtName("Court 1");
        court.setDescription("Indoor");
        court.setHourlyRate(new BigDecimal("180000"));
        court.setOpensAt(LocalTime.of(6, 0));
        court.setClosesAt(LocalTime.of(22, 0));
        court.setActive(true);
        return court;
    }
}
