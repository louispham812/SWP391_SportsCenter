package com.sporthub.backend;

import com.sporthub.backend.controller.BookingFlowController;
import com.sporthub.backend.controller.EngagementController;
import com.sporthub.backend.controller.MemberProfileController;
import com.sporthub.backend.dto.AssistantChatRequest;
import com.sporthub.backend.dto.AssistantMessageRequest;
import com.sporthub.backend.dto.CancelBookingResponse;
import com.sporthub.backend.dto.MemberAttendanceSummaryResponse;
import com.sporthub.backend.entity.CourtBooking;
import com.sporthub.backend.entity.PublicSport;
import com.sporthub.backend.entity.SportsCourt;
import com.sporthub.backend.entity.SystemSetting;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CourtBookingRepository;
import com.sporthub.backend.repository.MemberCheckInRepository;
import com.sporthub.backend.repository.MemberHealthProfileRepository;
import com.sporthub.backend.repository.MembershipPackageRepository;
import com.sporthub.backend.repository.PaymentTransactionRepository;
import com.sporthub.backend.repository.PublicSportRepository;
import com.sporthub.backend.repository.ReceptionPaymentRepository;
import com.sporthub.backend.repository.SportsCourtRepository;
import com.sporthub.backend.repository.SystemSettingRepository;
import com.sporthub.backend.repository.UserMembershipRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.service.AiAssistantService;
import com.sporthub.backend.service.BookingService;
import com.sporthub.backend.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.ObjectMapper;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LuongsTwoRegressionTest {

    @Test
    void notificationsMappingIsNotDuplicatedBetweenControllers() throws NoSuchMethodException {
        Method engagementMethod = EngagementController.class.getMethod("myNotifications", org.springframework.security.core.Authentication.class);
        GetMapping engagementMapping = engagementMethod.getAnnotation(GetMapping.class);
        List<String> engagementPaths = Arrays.asList(engagementMapping.value());
        assertTrue(engagementPaths.contains("/notifications"));
        assertFalse(engagementPaths.contains("/members/me/notifications"),
                "EngagementController must not duplicate /members/me/notifications handled by MemberProfileController");

        Method profileMethod = MemberProfileController.class.getMethod("getNotifications", org.springframework.security.core.Authentication.class);
        GetMapping profileMapping = profileMethod.getAnnotation(GetMapping.class);
        assertTrue(Arrays.asList(profileMapping.value()).contains("/notifications"));
    }

    @Test
    void bookingFlowAllowsCancellingPtScheduleEntryAndRejectsInvalidType() {
        BookingService bookingService = mock(BookingService.class);
        BookingFlowController controller = new BookingFlowController(bookingService);
        var auth = new UsernamePasswordAuthenticationToken(
                "12", "", List.of(new SimpleGrantedAuthority("ROLE_MEMBER")));
        CancelBookingResponse expected = CancelBookingResponse.builder()
                .bookingType("PT")
                .bookingId(88L)
                .status("CANCELLED")
                .build();
        when(bookingService.cancelClassBooking(88L, 12L)).thenReturn(expected);

        var response = controller.cancelScheduleEntry("PT", 88L, auth);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(expected, response.getBody());
        verify(bookingService).cancelClassBooking(88L, 12L);

        ResponseStatusException badType = assertThrows(ResponseStatusException.class,
                () -> controller.cancelScheduleEntry("OTHER", 88L, auth));
        assertEquals(400, badType.getStatusCode().value());
    }

    @Test
    void memberAttendanceReturnsSortedNonCancelledCourtBookings() {
        CourtBookingRepository courtBookingRepository = mock(CourtBookingRepository.class);
        SportsCourtRepository sportsCourtRepository = mock(SportsCourtRepository.class);
        PublicSportRepository sportRepo = mock(PublicSportRepository.class);
        BookingRepository bookingRepo = mock(BookingRepository.class);
        ClassSessionRepository sessionRepo = mock(ClassSessionRepository.class);
        UserRepository userRepo = mock(UserRepository.class);
        MemberCheckInRepository checkInRepo = mock(MemberCheckInRepository.class);

        MemberProfileController controller = new MemberProfileController(
                userRepo,
                mock(MemberHealthProfileRepository.class),
                mock(UserMembershipRepository.class),
                mock(MembershipPackageRepository.class),
                mock(ReceptionPaymentRepository.class),
                mock(PaymentTransactionRepository.class),
                bookingRepo,
                sessionRepo,
                checkInRepo,
                sportRepo,
                mock(PaymentService.class),
                courtBookingRepository,
                sportsCourtRepository);

        when(bookingRepo.findByMemberId(12L)).thenReturn(List.of());
        when(checkInRepo.findByMemberIdOrderByCheckedInAtDesc(12L)).thenReturn(List.of());

        PublicSport badminton = new PublicSport();
        badminton.setSportId(3L);
        badminton.setName("Cầu lông");
        when(sportRepo.findAll()).thenReturn(List.of(badminton));

        SportsCourt courtA = new SportsCourt();
        courtA.setCourtId(5L);
        courtA.setCourtName("Sân Cầu Lông 1");
        courtA.setSportId(3L);
        when(sportsCourtRepository.findAllById(List.of(5L))).thenReturn(List.of(courtA));

        LocalDateTime earlier = LocalDateTime.now().plusDays(1);
        LocalDateTime later = LocalDateTime.now().plusDays(3);

        CourtBooking b1 = new CourtBooking();
        b1.setCourtBookingId(1L);
        b1.setMemberId(12L);
        b1.setCourtId(5L);
        b1.setStartTime(earlier);
        b1.setEndTime(earlier.plusHours(1));
        b1.setAmountPaid(new BigDecimal("120000"));
        b1.setStatus("CONFIRMED");

        CourtBooking bCancelled = new CourtBooking();
        bCancelled.setCourtBookingId(2L);
        bCancelled.setMemberId(12L);
        bCancelled.setCourtId(5L);
        bCancelled.setStartTime(earlier.plusDays(1));
        bCancelled.setEndTime(earlier.plusDays(1).plusHours(1));
        bCancelled.setAmountPaid(new BigDecimal("120000"));
        bCancelled.setStatus("CANCELLED");

        CourtBooking b3 = new CourtBooking();
        b3.setCourtBookingId(3L);
        b3.setMemberId(12L);
        b3.setCourtId(5L);
        b3.setStartTime(later);
        b3.setEndTime(later.plusHours(1));
        b3.setAmountPaid(new BigDecimal("150000"));
        b3.setStatus("PAID");

        when(courtBookingRepository.findByMemberIdOrderByStartTimeAsc(12L)).thenReturn(List.of(b1, bCancelled, b3));

        MemberAttendanceSummaryResponse summary = controller.getAttendance(
                new UsernamePasswordAuthenticationToken("12", "", List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))));
        assertEquals(2, summary.courtBookings().size());
        assertEquals(3L, summary.courtBookings().get(0).courtBookingId());
        assertEquals("Sân Cầu Lông 1", summary.courtBookings().get(0).courtName());
        assertEquals("Cầu lông", summary.courtBookings().get(0).sportName());
        assertEquals(new BigDecimal("150000"), summary.courtBookings().get(0).amountPaid());
        assertEquals(1L, summary.courtBookings().get(1).courtBookingId());
    }

    @Test
    void aiAssistantServiceRespectsDisabledFlagAndCustomPromptFromSettings() {
        SystemSettingRepository settingRepo = mock(SystemSettingRepository.class);
        MemberHealthProfileRepository healthRepo = mock(MemberHealthProfileRepository.class);
        BookingRepository bookingRepo = mock(BookingRepository.class);
        ClassSessionRepository sessionRepo = mock(ClassSessionRepository.class);

        AiAssistantService service = new AiAssistantService(
                healthRepo,
                bookingRepo,
                sessionRepo,
                new ObjectMapper(),
                "",
                "gemini-flash-lite-latest",
                "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                settingRepo);

        when(settingRepo.findById("ai_enabled"))
                .thenReturn(Optional.of(new SystemSetting("ai_enabled", "false", LocalDateTime.now())));

        ResponseStatusException disabled = assertThrows(ResponseStatusException.class,
                () -> service.chatAsMember(12L, new AssistantChatRequest(
                        List.of(new AssistantMessageRequest("user", "Xin chào")))));
        assertEquals(503, disabled.getStatusCode().value());

        when(settingRepo.findById("ai_enabled"))
                .thenReturn(Optional.of(new SystemSetting("ai_enabled", "true", LocalDateTime.now())));
        when(settingRepo.findById("ai_model"))
                .thenReturn(Optional.of(new SystemSetting("ai_model", "gpt-4o-mini", LocalDateTime.now())));
        when(settingRepo.findById("ai_temperature"))
                .thenReturn(Optional.of(new SystemSetting("ai_temperature", "0.7", LocalDateTime.now())));
        when(settingRepo.findById("ai_system_prompt"))
                .thenReturn(Optional.of(new SystemSetting("ai_system_prompt", "Bạn là coach thân thiện.", LocalDateTime.now())));
        when(healthRepo.findByMemberId(12L)).thenReturn(Optional.empty());
        when(bookingRepo.findByMemberIdAndStatusIn(12L, List.of("BOOKED", "CONFIRMED", "COMPLETED"))).thenReturn(List.of());

        String fallbackAnswer = service.chatAsMember(12L, new AssistantChatRequest(
                List.of(new AssistantMessageRequest("user", "Xin chào"))));
        assertTrue(fallbackAnswer.contains("AI Smart Coach"));
    }
}
