package com.sporthub.backend.workflow;

import com.sporthub.backend.controller.CoachLeaveController;
import com.sporthub.backend.dto.CoachLeaveRequestDTO;
import com.sporthub.backend.dto.CreateLeaveRequest;
import com.sporthub.backend.dto.LeaveDecisionRequest;
import com.sporthub.backend.entity.*;
import com.sporthub.backend.repository.*;
import com.sporthub.backend.service.EngagementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Test workflow Coach Leave Request: tạo đơn, thông báo, audit log, duyệt đơn
 * Coverage: Issues #3, #4, #5
 */
class CoachLeaveWorkflowTest {

    private CoachLeaveController controller;
    private CoachLeaveRequestRepository leaveRepository;
    private UserRepository userRepository;
    private ClassSessionRepository classSessionRepository;
    private BookingRepository bookingRepository;
    private EngagementService engagementService;
    private Authentication auth;

    @BeforeEach
    void setUp() {
        leaveRepository = mock(CoachLeaveRequestRepository.class);
        userRepository = mock(UserRepository.class);
        classSessionRepository = mock(ClassSessionRepository.class);
        bookingRepository = mock(BookingRepository.class);
        engagementService = mock(EngagementService.class);
        auth = mock(Authentication.class);

        controller = new CoachLeaveController(
                leaveRepository,
                userRepository,
                classSessionRepository,
                bookingRepository,
                engagementService
        );
    }

    /**
     * Issue #3: Coach tạo đơn → ghi audit log + thông báo Manager
     */
    @Test
    void testCoachCreateLeaveRequest_ShouldAuditAndNotifyManagers() {
        // Given
        Long coachId = 2L;
        when(auth.getName()).thenReturn(coachId.toString());

        User coach = new User();
        coach.setUserId(coachId);
        coach.setFullName("Coach Nguyễn Văn A");
        coach.setRole("COACH");
        when(userRepository.findById(coachId)).thenReturn(Optional.of(coach));

        User manager1 = new User();
        manager1.setUserId(100L);
        manager1.setRole("MANAGER");
        manager1.setStatus("ACTIVE");

        User manager2 = new User();
        manager2.setUserId(101L);
        manager2.setRole("MANAGER");
        manager2.setStatus("ACTIVE");

        when(userRepository.findAll()).thenReturn(List.of(coach, manager1, manager2));
        when(classSessionRepository.findAll()).thenReturn(List.of());
        when(bookingRepository.findBySessionIdInAndStatusIn(anyList(), anyList())).thenReturn(List.of());

        CoachLeaveRequest savedRequest = CoachLeaveRequest.builder()
                .requestId(1L)
                .coachId(coachId)
                .coachName("Coach Nguyễn Văn A")
                .leaveType("SICK_LEAVE")
                .startDate(LocalDate.now().plusDays(7))
                .endDate(LocalDate.now().plusDays(9))
                .reason("Khám bệnh định kỳ")
                .status("PENDING")
                .affectedBookingsCount(0)
                .createdAt(LocalDateTime.now())
                .build();
        when(leaveRepository.save(any(CoachLeaveRequest.class))).thenReturn(savedRequest);

        CreateLeaveRequest request = new CreateLeaveRequest(
                "SICK_LEAVE",
                LocalDate.now().plusDays(7),
                LocalDate.now().plusDays(9),
                "Khám bệnh định kỳ"
        );

        // When
        ResponseEntity<CoachLeaveRequestDTO> response = controller.createLeaveRequest(request, auth);

        // Then
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("PENDING", response.getBody().status());

        // Verify audit log được gọi
        ArgumentCaptor<String> actionCaptor = ArgumentCaptor.forClass(String.class);
        verify(engagementService, times(1)).audit(
                eq(coachId),
                eq("COACH"),
                actionCaptor.capture(),
                contains("requestId=1")
        );
        assertEquals("COACH_LEAVE_REQUEST_CREATED", actionCaptor.getValue());

        // Verify thông báo 2 managers
        ArgumentCaptor<Long> userIdCaptor = ArgumentCaptor.forClass(Long.class);
        ArgumentCaptor<String> titleCaptor = ArgumentCaptor.forClass(String.class);
        verify(engagementService, times(2)).notifyUser(
                userIdCaptor.capture(),
                titleCaptor.capture(),
                anyString(),
                eq("APPROVAL_NEEDED")
        );

        List<Long> notifiedUsers = userIdCaptor.getAllValues();
        assertTrue(notifiedUsers.contains(100L));
        assertTrue(notifiedUsers.contains(101L));
        assertEquals("Đơn xin nghỉ mới cần duyệt", titleCaptor.getAllValues().get(0));
    }

    /**
     * Issue #4: Manager APPROVE đơn → thông báo Coach + reassign sessions
     */
    @Test
    void testManagerApproveLeaveRequest_ShouldNotifyCoachAndReassignSessions() {
        // Given
        Long managerId = 100L;
        Long coachId = 2L;
        Long reassignedCoachId = 3L;
        Long requestId = 1L;

        when(auth.getName()).thenReturn(managerId.toString());

        CoachLeaveRequest leaveRequest = CoachLeaveRequest.builder()
                .requestId(requestId)
                .coachId(coachId)
                .coachName("Coach Nguyễn Văn A")
                .leaveType("SICK_LEAVE")
                .startDate(LocalDate.now().plusDays(7))
                .endDate(LocalDate.now().plusDays(9))
                .reason("Khám bệnh định kỳ")
                .status("PENDING")
                .affectedBookingsCount(2)
                .createdAt(LocalDateTime.now())
                .build();
        when(leaveRepository.findById(requestId)).thenReturn(Optional.of(leaveRequest));

        User replacementCoach = new User();
        replacementCoach.setUserId(reassignedCoachId);
        replacementCoach.setFullName("Coach Trần Văn B");
        replacementCoach.setRole("COACH");
        when(userRepository.findById(reassignedCoachId)).thenReturn(Optional.of(replacementCoach));

        ClassSession session1 = new ClassSession();
        session1.setSessionId(10L);
        session1.setCoachId(coachId);
        session1.setStatus("SCHEDULED");
        session1.setStartTime(LocalDateTime.now().plusDays(8));

        ClassSession session2 = new ClassSession();
        session2.setSessionId(11L);
        session2.setCoachId(coachId);
        session2.setStatus("SCHEDULED");
        session2.setStartTime(LocalDateTime.now().plusDays(9));

        when(classSessionRepository.findAll()).thenReturn(List.of(session1, session2));
        when(classSessionRepository.saveAll(anyList())).thenReturn(List.of(session1, session2));

        Booking booking1 = new Booking();
        booking1.setBookingId(20L);
        booking1.setMemberId(50L);
        booking1.setSessionId(10L);
        booking1.setStatus("CONFIRMED");

        Booking booking2 = new Booking();
        booking2.setBookingId(21L);
        booking2.setMemberId(51L);
        booking2.setSessionId(11L);
        booking2.setStatus("CONFIRMED");

        when(bookingRepository.findBySessionIdInAndStatusIn(anyList(), anyList()))
                .thenReturn(List.of(booking1, booking2));

        when(leaveRepository.save(any(CoachLeaveRequest.class))).thenReturn(leaveRequest);

        LeaveDecisionRequest decision = new LeaveDecisionRequest(
                true,
                reassignedCoachId,
                "Đồng ý cho nghỉ"
        );

        // When
        ResponseEntity<CoachLeaveRequestDTO> response = controller.decideLeaveRequest(requestId, decision, auth);

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // Verify audit log reassign
        verify(engagementService, times(1)).audit(
                eq(managerId),
                eq("MANAGER"),
                eq("COACH_LEAVE_REASSIGNED"),
                contains("newCoach=Coach Trần Văn B")
        );

        // Verify thông báo 2 members
        verify(engagementService, times(2)).notifyUser(
                anyLong(),
                eq("Thay đổi Huấn luyện viên"),
                contains("Coach Trần Văn B"),
                eq("SCHEDULE")
        );

        // Verify thông báo Coach (Issue #4)
        ArgumentCaptor<Long> coachCaptor = ArgumentCaptor.forClass(Long.class);
        ArgumentCaptor<String> titleCaptor = ArgumentCaptor.forClass(String.class);
        verify(engagementService, atLeastOnce()).notifyUser(
                coachCaptor.capture(),
                titleCaptor.capture(),
                anyString(),
                eq("APPROVAL_RESULT")
        );

        List<Long> notifiedCoaches = coachCaptor.getAllValues();
        assertTrue(notifiedCoaches.contains(coachId));
        assertTrue(titleCaptor.getAllValues().stream().anyMatch(t -> t.contains("được chấp thuận")));
    }

    /**
     * Issue #4 + #5: Manager REJECT đơn → thông báo Coach + ghi audit log
     */
    @Test
    void testManagerRejectLeaveRequest_ShouldNotifyCoachAndAuditLog() {
        // Given
        Long managerId = 100L;
        Long coachId = 2L;
        Long requestId = 1L;

        when(auth.getName()).thenReturn(managerId.toString());

        CoachLeaveRequest leaveRequest = CoachLeaveRequest.builder()
                .requestId(requestId)
                .coachId(coachId)
                .coachName("Coach Nguyễn Văn A")
                .leaveType("PERSONAL_LEAVE")
                .startDate(LocalDate.now().plusDays(7))
                .endDate(LocalDate.now().plusDays(9))
                .reason("Việc gia đình"
                )
                .status("PENDING")
                .affectedBookingsCount(5)
                .createdAt(LocalDateTime.now())
                .build();
        when(leaveRepository.findById(requestId)).thenReturn(Optional.of(leaveRequest));
        when(leaveRepository.save(any(CoachLeaveRequest.class))).thenReturn(leaveRequest);

        LeaveDecisionRequest decision = new LeaveDecisionRequest(
                false,
                null,
                "Lịch giảng dạy quá kín, không đủ HLV thay thế. Vui lòng đổi thời gian."
        );

        // When
        ResponseEntity<CoachLeaveRequestDTO> response = controller.decideLeaveRequest(requestId, decision, auth);

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // Verify audit log REJECT (Issue #5)
        ArgumentCaptor<String> actionCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> detailCaptor = ArgumentCaptor.forClass(String.class);
        verify(engagementService, times(1)).audit(
                eq(managerId),
                eq("MANAGER"),
                actionCaptor.capture(),
                detailCaptor.capture()
        );
        assertEquals("COACH_LEAVE_REJECTED", actionCaptor.getValue());
        assertTrue(detailCaptor.getValue().contains("Lịch giảng dạy quá kín"));

        // Verify thông báo Coach bị từ chối (Issue #4)
        ArgumentCaptor<Long> coachCaptor = ArgumentCaptor.forClass(Long.class);
        ArgumentCaptor<String> titleCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);
        verify(engagementService, times(1)).notifyUser(
                coachCaptor.capture(),
                titleCaptor.capture(),
                bodyCaptor.capture(),
                eq("APPROVAL_RESULT")
        );

        assertEquals(coachId, coachCaptor.getValue());
        assertTrue(titleCaptor.getValue().contains("bị từ chối"));
        assertTrue(bodyCaptor.getValue().contains("Lịch giảng dạy quá kín"));
    }
}
