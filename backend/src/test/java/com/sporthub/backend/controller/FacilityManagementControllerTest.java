package com.sporthub.backend.controller;

import com.sporthub.backend.dto.CreateClassSessionRequest;
import com.sporthub.backend.entity.Facility;
import com.sporthub.backend.entity.Sport;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.FacilityRepository;
import com.sporthub.backend.repository.SportRepository;
import com.sporthub.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
    void managerCanCreateWeeklySessionsMatchingTheConfiguredCount() {
        Facility facility = new Facility();
        facility.setFacilityId(7L);
        facility.setSportId(3L);
        facility.setStatus("AVAILABLE");
        when(facilityRepository.findById(7L)).thenReturn(Optional.of(facility));
        when(sportRepository.findById(3L)).thenReturn(Optional.of(new Sport()));
        when(userRepository.findById(9L)).thenReturn(Optional.of(
                User.builder().userId(9L).role("COACH").build()));
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
        when(sportRepository.findById(3L)).thenReturn(Optional.of(new Sport()));
        when(userRepository.findById(9L)).thenReturn(Optional.of(
                User.builder().userId(9L).role("COACH").build()));

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
}
