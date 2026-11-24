package com.sporthub.backend.controller;

import com.sporthub.backend.dto.CreateClassSessionRequest;
import com.sporthub.backend.dto.UpdateClassSessionRequest;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.CoachLeaveRequest;
import com.sporthub.backend.entity.Facility;
import com.sporthub.backend.entity.Sport;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CoachLeaveRequestRepository;
import com.sporthub.backend.repository.FacilityRepository;
import com.sporthub.backend.repository.SportRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.service.CoachAvailabilityService;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FacilityManagementControllerTest {

    private final FacilityRepository facilityRepository = mock(FacilityRepository.class);
    private final SportRepository sportRepository = mock(SportRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final ClassSessionRepository classSessionRepository = mock(ClassSessionRepository.class);
    private final FacilityManagementController controller = new FacilityManagementController(
            facilityRepository, sportRepository, userRepository, classSessionRepository);
    private final UsernamePasswordAuthenticationToken manager = new UsernamePasswordAuthenticationToken(
            "1", "", List.of(new SimpleGrantedAuthority("ROLE_MANAGER")));

    @Test
    void classCreationRequiresAnExplicitTuitionAmount() {
        var start = LocalDateTime.now().plusDays(1);
        var request = new CreateClassSessionRequest("Lớp cầu lông", 3L, 9L, 7L,
                start, start.plusHours(1), 1, 8, null);
        var error = assertThrows(ResponseStatusException.class,
                () -> controller.createClassSession(request, manager));
        assertEquals(400, error.getStatusCode().value());
        assertTrue(error.getReason().contains("Vui lòng nhập học phí"));
        org.mockito.Mockito.verifyNoInteractions(facilityRepository, sportRepository, userRepository, classSessionRepository);
    }

    @Test
    void managerCanCreateWeeklySessionsMatchingTheConfiguredCount() {
        Facility facility = new Facility();
        facility.setFacilityId(7L);
        facility.setSportId(3L);
        facility.setStatus("AVAILABLE");
        when(facilityRepository.findById(7L)).thenReturn(Optional.of(facility));
        Sport badminton = new Sport();
        badminton.setSportId(3L);
        badminton.setSportName("Cầu lông");
        when(sportRepository.findById(3L)).thenReturn(Optional.of(badminton));
        when(userRepository.findById(9L)).thenReturn(Optional.of(
                User.builder().userId(9L).fullName("HLV Thảo").role("COACH").specialty("Cầu lông, Yoga & Pilates").build()));
        when(classSessionRepository.saveAll(any())).thenAnswer(invocation -> {
            Iterable<com.sporthub.backend.entity.ClassSession> requested = invocation.getArgument(0);
            List<com.sporthub.backend.entity.ClassSession> saved = new ArrayList<>();
            requested.forEach(saved::add);
            return saved;
        });

        LocalDateTime startTime = LocalDateTime.now().plusDays(2).withSecond(0).withNano(0);
        CreateClassSessionRequest request = new CreateClassSessionRequest(
                "Lớp cầu lông", 3L, 9L, 7L, startTime, startTime.plusHours(1),
                4, 12, new BigDecimal("150000"));

        var result = controller.createClassSession(request, manager);

        assertEquals(4, result.size());
        for (int index = 0; index < result.size(); index++) {
            assertEquals(startTime.plusWeeks(index), result.get(index).getStartTime());
            assertEquals(startTime.plusHours(1).plusWeeks(index), result.get(index).getEndTime());
            assertEquals("Lớp cầu lông", result.get(index).getClassName());
            assertEquals(9L, result.get(index).getCoachId());
        }
        verify(classSessionRepository).saveAll(any());
    }

    @Test
    void classCreationRejectsSessionCountsOutsideSupportedRange() {
        LocalDateTime startTime = LocalDateTime.now().plusDays(2);
        CreateClassSessionRequest request = new CreateClassSessionRequest(
                "Lớp cầu lông", 3L, 9L, 7L, startTime, startTime.plusHours(1),
                0, 12, BigDecimal.ZERO);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.createClassSession(request, manager));

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void classCreationRejectsOverlappingCoachSession() {
        Facility facility = new Facility();
        facility.setFacilityId(7L);
        facility.setSportId(3L);
        facility.setStatus("AVAILABLE");
        when(facilityRepository.findById(7L)).thenReturn(Optional.of(facility));
        Sport badminton = new Sport();
        badminton.setSportId(3L);
        badminton.setSportName("Cầu lông");
        when(sportRepository.findById(3L)).thenReturn(Optional.of(badminton));
        when(userRepository.findById(9L)).thenReturn(Optional.of(
                User.builder().userId(9L).fullName("HLV Thảo").role("COACH").specialty("Cầu lông, Yoga & Pilates").build()));

        LocalDateTime startTime = LocalDateTime.now().plusDays(2).withSecond(0).withNano(0);
        com.sporthub.backend.entity.ClassSession existingSession = new com.sporthub.backend.entity.ClassSession();
        existingSession.setSessionId(101L);
        existingSession.setCoachId(9L);
        existingSession.setFacilityId(8L);
        existingSession.setStartTime(startTime.minusMinutes(30));
        existingSession.setEndTime(startTime.plusMinutes(30));
        existingSession.setStatus("SCHEDULED");

        when(classSessionRepository.findByCoachIdOrderByStartTimeAsc(9L)).thenReturn(List.of(existingSession));

        CreateClassSessionRequest request = new CreateClassSessionRequest(
                "Lớp cầu lông nâng cao", 3L, 9L, 7L, startTime, startTime.plusHours(1),
                1, 12, new BigDecimal("150000"));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.createClassSession(request, manager));

        assertEquals(409, exception.getStatusCode().value());
    }

    @Test
    void classCreationRejectsCoachTeachingDifferentSport() {
        Facility facility = new Facility();
        facility.setFacilityId(7L);
        facility.setSportId(3L);
        facility.setStatus("AVAILABLE");
        Sport tennis = new Sport();
        tennis.setSportId(3L);
        tennis.setSportName("Tennis");
        when(facilityRepository.findById(7L)).thenReturn(Optional.of(facility));
        when(sportRepository.findById(3L)).thenReturn(Optional.of(tennis));
        when(userRepository.findById(9L)).thenReturn(Optional.of(
                User.builder().userId(9L).fullName("HLV Phát").role("COACH").specialty("Bóng đá, Điền kinh").build()));

        LocalDateTime startTime = LocalDateTime.now().plusDays(2).withSecond(0).withNano(0);
        CreateClassSessionRequest request = new CreateClassSessionRequest(
                "Lớp Tennis cơ bản", 3L, 9L, 7L, startTime, startTime.plusHours(1),
                1, 10, new BigDecimal("150000"));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.createClassSession(request, manager));

        assertEquals(400, exception.getStatusCode().value());
        assertNotNull(exception.getReason());
        assertTrue(exception.getReason().contains("Tennis"));
    }

    @Test
    void classCreationRejectsCoachWithoutAssignedSport() {
        Facility facility = new Facility();
        facility.setFacilityId(7L);
        facility.setSportId(3L);
        facility.setStatus("AVAILABLE");
        Sport tennis = new Sport();
        tennis.setSportId(3L);
        tennis.setSportName("Tennis");
        when(facilityRepository.findById(7L)).thenReturn(Optional.of(facility));
        when(sportRepository.findById(3L)).thenReturn(Optional.of(tennis));
        when(userRepository.findById(9L)).thenReturn(Optional.of(
                User.builder().userId(9L).fullName("HLV Mới").role("COACH").specialty("   ").build()));

        LocalDateTime startTime = LocalDateTime.now().plusDays(2).withSecond(0).withNano(0);
        CreateClassSessionRequest request = new CreateClassSessionRequest(
                "Lớp Tennis cơ bản", 3L, 9L, 7L, startTime, startTime.plusHours(1),
                1, 10, new BigDecimal("150000"));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> controller.createClassSession(request, manager));

        assertEquals(400, exception.getStatusCode().value());
    }

    @Test
    void classUpdateValidatesCoachAndFacilityAgainstSessionSport() {
        Sport tennis = new Sport();
        tennis.setSportId(3L);
        tennis.setSportName("Tennis");
        ClassSession session = ClassSession.builder()
                .sessionId(50L)
                .className("Lớp Tennis T1")
                .sportId(3L)
                .coachId(5L)
                .facilityId(7L)
                .startTime(LocalDateTime.now().plusDays(3))
                .endTime(LocalDateTime.now().plusDays(3).plusHours(1))
                .maxSlots(8)
                .status("SCHEDULED")
                .build();

        when(classSessionRepository.findById(50L)).thenReturn(Optional.of(session));
        when(sportRepository.findById(3L)).thenReturn(Optional.of(tennis));
        when(userRepository.findById(7L)).thenReturn(Optional.of(
                User.builder().userId(7L).fullName("HLV Phát").role("COACH").specialty("Bóng đá").build()));
        when(userRepository.findById(6L)).thenReturn(Optional.of(
                User.builder().userId(6L).fullName("HLV Minh").role("COACH").specialty("Tennis, Pickleball").build()));
        Facility tennisCourt = new Facility();
        tennisCourt.setFacilityId(7L);
        tennisCourt.setSportId(3L);
        when(facilityRepository.findById(7L)).thenReturn(Optional.of(tennisCourt));
        Facility footballField = new Facility();
        footballField.setFacilityId(8L);
        footballField.setSportId(5L);
        when(facilityRepository.findById(8L)).thenReturn(Optional.of(footballField));
        when(classSessionRepository.save(any(ClassSession.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseStatusException wrongCoach = assertThrows(
                ResponseStatusException.class,
                () -> controller.updateClassSession(50L,
                        new UpdateClassSessionRequest(null, 7L, 7L, null, null, null, null, null),
                        manager));
        assertEquals(400, wrongCoach.getStatusCode().value());

        ResponseStatusException wrongFacility = assertThrows(
                ResponseStatusException.class,
                () -> controller.updateClassSession(50L,
                        new UpdateClassSessionRequest(null, 6L, 8L, null, null, null, null, null),
                        manager));
        assertEquals(400, wrongFacility.getStatusCode().value());

        ClassSession updated = controller.updateClassSession(50L,
                new UpdateClassSessionRequest(null, 6L, 7L, null, null, null, null, null),
                manager);
        assertEquals(6L, updated.getCoachId());
    }

    @Test
    void classCreationPrioritizesCoachedSportsOverSpecialtyText() {
        Facility facility = new Facility();
        facility.setFacilityId(7L);
        facility.setSportId(3L);
        facility.setStatus("AVAILABLE");
        Sport tennis = new Sport();
        tennis.setSportId(3L);
        tennis.setSportName("Tennis");
        Sport football = new Sport();
        football.setSportId(5L);
        football.setSportName("Bóng đá");

        when(facilityRepository.findById(7L)).thenReturn(Optional.of(facility));
        when(sportRepository.findById(3L)).thenReturn(Optional.of(tennis));
        when(classSessionRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        // Even if free-text specialty mentions Tennis, non-empty coachedSports without sport 3 rejects
        User restrictedCoach = User.builder()
                .userId(10L)
                .fullName("HLV Hạn Chế")
                .role("COACH")
                .specialty("Tennis")
                .coachedSports(Set.of(football))
                .build();
        when(userRepository.findById(10L)).thenReturn(Optional.of(restrictedCoach));

        LocalDateTime startTime = LocalDateTime.now().plusDays(2).withSecond(0).withNano(0);
        CreateClassSessionRequest blockedReq = new CreateClassSessionRequest(
                "Lớp Tennis Nâng Cao", 3L, 10L, 7L, startTime, startTime.plusHours(1),
                1, 10, new BigDecimal("150000"));
        assertEquals(400, assertThrows(ResponseStatusException.class,
                () -> controller.createClassSession(blockedReq, manager)).getStatusCode().value());

        // When coachedSports includes sport 3, creation succeeds even if specialty text is empty
        User relationalCoach = User.builder()
                .userId(11L)
                .fullName("HLV Quan Hệ")
                .role("COACH")
                .specialty(null)
                .coachedSports(Set.of(tennis))
                .build();
        when(userRepository.findById(11L)).thenReturn(Optional.of(relationalCoach));

        CreateClassSessionRequest allowedReq = new CreateClassSessionRequest(
                "Lớp Tennis Nâng Cao", 3L, 11L, 7L, startTime, startTime.plusHours(1),
                1, 10, new BigDecimal("150000"));
        var saved = controller.createClassSession(allowedReq, manager);
        assertEquals(1, saved.size());
        assertEquals(11L, saved.getFirst().getCoachId());
    }

    @Test
    void classCreationRejectsCoachOnApprovedLeave() {
        CoachLeaveRequestRepository leaveRepository = mock(CoachLeaveRequestRepository.class);
        FacilityManagementController controllerWithAvail = new FacilityManagementController(
                facilityRepository, sportRepository, userRepository, classSessionRepository);
        ReflectionTestUtils.setField(controllerWithAvail, "coachAvailabilityService",
                new CoachAvailabilityService(leaveRepository));

        Facility facility = new Facility();
        facility.setFacilityId(7L);
        facility.setSportId(3L);
        facility.setStatus("AVAILABLE");
        Sport badminton = new Sport();
        badminton.setSportId(3L);
        badminton.setSportName("Cầu lông");
        User coach = User.builder()
                .userId(9L)
                .fullName("HLV Thảo")
                .role("COACH")
                .status("ACTIVE")
                .specialty("Cầu lông")
                .build();

        LocalDateTime startTime = LocalDateTime.now().plusDays(2).withHour(9).withMinute(0).withSecond(0).withNano(0);
        when(facilityRepository.findById(7L)).thenReturn(Optional.of(facility));
        when(sportRepository.findById(3L)).thenReturn(Optional.of(badminton));
        when(userRepository.findById(9L)).thenReturn(Optional.of(coach));
        when(leaveRepository.findByCoachIdOrderByCreatedAtDesc(9L)).thenReturn(List.of(
                CoachLeaveRequest.builder()
                        .requestId(1L)
                        .coachId(9L)
                        .leaveType("PERSONAL_LEAVE")
                        .startDate(startTime.toLocalDate())
                        .endDate(startTime.toLocalDate())
                        .reason("Nghỉ phép cá nhân")
                        .status("APPROVED")
                        .build()));

        CreateClassSessionRequest request = new CreateClassSessionRequest(
                "Lớp cầu lông", 3L, 9L, 7L, startTime, startTime.plusHours(1),
                1, 10, new BigDecimal("150000"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> controllerWithAvail.createClassSession(request, manager));
        assertEquals(409, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("nghỉ phép"));
    }

    @Test
    void classUpdateRejectsUnavailableCoachOrMaintenanceFacility() {
        CoachLeaveRequestRepository leaveRepository = mock(CoachLeaveRequestRepository.class);
        FacilityManagementController controllerWithAvail = new FacilityManagementController(
                facilityRepository, sportRepository, userRepository, classSessionRepository);
        ReflectionTestUtils.setField(controllerWithAvail, "coachAvailabilityService",
                new CoachAvailabilityService(leaveRepository));

        Sport tennis = new Sport();
        tennis.setSportId(3L);
        tennis.setSportName("Tennis");
        LocalDateTime start = LocalDateTime.now().plusDays(3).withHour(19).withMinute(0).withSecond(0).withNano(0);
        DayOfWeek dow = start.getDayOfWeek();

        ClassSession session = ClassSession.builder()
                .sessionId(50L)
                .className("Lớp Tennis Tối")
                .sportId(3L)
                .coachId(5L)
                .facilityId(7L)
                .startTime(start)
                .endTime(start.plusHours(1))
                .maxSlots(8)
                .status("SCHEDULED")
                .build();

        User unavailableCoach = User.builder()
                .userId(6L)
                .fullName("HLV Minh")
                .role("COACH")
                .status("ACTIVE")
                .specialty("Tennis")
                .availabilityJson("[{\"day\":\"" + dow.name() + "\",\"morning\":true,\"afternoon\":false,\"evening\":false}]")
                .build();
        User availableCoach = User.builder()
                .userId(8L)
                .fullName("HLV An")
                .role("COACH")
                .status("ACTIVE")
                .specialty("Tennis")
                .build();
        Facility maintenanceFacility = new Facility();
        maintenanceFacility.setFacilityId(7L);
        maintenanceFacility.setSportId(3L);
        maintenanceFacility.setStatus("MAINTENANCE");

        when(classSessionRepository.findById(50L)).thenReturn(Optional.of(session));
        when(sportRepository.findById(3L)).thenReturn(Optional.of(tennis));
        when(userRepository.findById(6L)).thenReturn(Optional.of(unavailableCoach));
        when(userRepository.findById(8L)).thenReturn(Optional.of(availableCoach));
        when(leaveRepository.findByCoachIdOrderByCreatedAtDesc(6L)).thenReturn(List.of());
        when(leaveRepository.findByCoachIdOrderByCreatedAtDesc(8L)).thenReturn(List.of());
        when(facilityRepository.findById(7L)).thenReturn(Optional.of(maintenanceFacility));

        ResponseStatusException unavailEx = assertThrows(ResponseStatusException.class,
                () -> controllerWithAvail.updateClassSession(50L,
                        new UpdateClassSessionRequest(null, 6L, 7L, null, null, null, null, null),
                        manager));
        assertEquals(409, unavailEx.getStatusCode().value());

        ResponseStatusException maintEx = assertThrows(ResponseStatusException.class,
                () -> controllerWithAvail.updateClassSession(50L,
                        new UpdateClassSessionRequest(null, 8L, 7L, null, null, null, null, null),
                        manager));
        assertEquals(409, maintEx.getStatusCode().value());
    }
}
