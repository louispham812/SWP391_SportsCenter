package com.sporthub.backend.controller;

import com.sporthub.backend.dto.CoachLeaveRequestDTO;
import com.sporthub.backend.dto.CreateLeaveRequest;
import com.sporthub.backend.dto.LeaveDecisionRequest;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.CoachLeaveRequest;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CoachLeaveRequestRepository;
import com.sporthub.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@RestController
@CrossOrigin(origins = "*")
public class CoachLeaveController {

    private final CoachLeaveRequestRepository leaveRepository;
    private final UserRepository userRepository;
    private final ClassSessionRepository classSessionRepository;
    private final BookingRepository bookingRepository;

    public CoachLeaveController(
            CoachLeaveRequestRepository leaveRepository,
            UserRepository userRepository,
            ClassSessionRepository classSessionRepository,
            BookingRepository bookingRepository) {
        this.leaveRepository = leaveRepository;
        this.userRepository = userRepository;
        this.classSessionRepository = classSessionRepository;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/api/v1/coach/leave-requests")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CoachLeaveRequestDTO>> getMyLeaveRequests(Authentication auth) {
        Long coachId = getUserId(auth);
        List<CoachLeaveRequestDTO> list = leaveRepository.findByCoachIdOrderByCreatedAtDesc(coachId)
                .stream()
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/api/v1/coach/leave-requests")
    @Transactional
    public ResponseEntity<CoachLeaveRequestDTO> createLeaveRequest(
            @RequestBody CreateLeaveRequest req,
            Authentication auth) {
        Long coachId = getUserId(auth);
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy huấn luyện viên."));

        if (req.startDate() == null || req.endDate() == null || req.reason() == null || req.reason().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập đầy đủ thông tin xin nghỉ.");
        }
        if (req.endDate().isBefore(req.startDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày kết thúc không được trước ngày bắt đầu.");
        }

        LocalDateTime startDt = req.startDate().atStartOfDay();
        LocalDateTime endDt = req.endDate().plusDays(1).atStartOfDay();
        List<ClassSession> affectedSessions = classSessionRepository.findAll().stream()
                .filter(s -> java.util.Objects.equals(s.getCoachId(), coachId))
                .filter(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                .filter(s -> s.getStartTime() != null && !s.getStartTime().isBefore(startDt) && s.getStartTime().isBefore(endDt))
                .toList();

        List<Long> sessionIds = affectedSessions.stream().map(ClassSession::getSessionId).toList();
        int affectedCount = sessionIds.isEmpty() ? 0 :
                bookingRepository.findBySessionIdInAndStatusIn(sessionIds, List.of("BOOKED", "CONFIRMED")).size();

        CoachLeaveRequest request = CoachLeaveRequest.builder()
                .coachId(coachId)
                .coachName(coach.getFullName())
                .leaveType(req.leaveType() != null ? req.leaveType().toUpperCase(Locale.ROOT) : "PERSONAL_LEAVE")
                .startDate(req.startDate())
                .endDate(req.endDate())
                .reason(req.reason().trim())
                .status("PENDING")
                .affectedBookingsCount(affectedCount)
                .createdAt(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(leaveRepository.save(request)));
    }

    @GetMapping("/api/v1/manager/coach-leave-requests")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CoachLeaveRequestDTO>> getAllLeaveRequestsForManager() {
        return ResponseEntity.ok(leaveRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDTO).toList());
    }

    @PostMapping("/api/v1/manager/coach-leave-requests/{id}/decision")
    @Transactional
    public ResponseEntity<CoachLeaveRequestDTO> decideLeaveRequest(
            @PathVariable Long id,
            @RequestBody LeaveDecisionRequest decision,
            Authentication auth) {
        CoachLeaveRequest req = leaveRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu nghỉ."));

        Long managerId = getUserId(auth);
        req.setStatus(decision.approved() ? "APPROVED" : "REJECTED");
        req.setApprovedBy(managerId);

        if (decision.approved() && decision.reassignedCoachId() != null) {
            User replacementCoach = userRepository.findById(decision.reassignedCoachId())
                    .filter(u -> "COACH".equalsIgnoreCase(u.getRole()))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Huấn luyện viên thay thế không hợp lệ."));
            req.setReassignedCoachId(replacementCoach.getUserId());

            LocalDateTime startDt = req.getStartDate().atStartOfDay();
            LocalDateTime endDt = req.getEndDate().plusDays(1).atStartOfDay();
            List<ClassSession> sessionsToReassign = classSessionRepository.findAll().stream()
                    .filter(s -> java.util.Objects.equals(s.getCoachId(), req.getCoachId()))
                    .filter(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                    .filter(s -> s.getStartTime() != null && !s.getStartTime().isBefore(startDt) && s.getStartTime().isBefore(endDt))
                    .toList();
            for (ClassSession s : sessionsToReassign) {
                s.setCoachId(replacementCoach.getUserId());
            }
            classSessionRepository.saveAll(sessionsToReassign);
        } else if (decision.reassignedCoachId() != null) {
            req.setReassignedCoachId(decision.reassignedCoachId());
        }

        return ResponseEntity.ok(toDTO(leaveRepository.save(req)));
    }

    private CoachLeaveRequestDTO toDTO(CoachLeaveRequest r) {
        return new CoachLeaveRequestDTO(
                r.getRequestId(),
                r.getCoachId(),
                r.getCoachName(),
                r.getLeaveType(),
                r.getStartDate(),
                r.getEndDate(),
                r.getReason(),
                r.getStatus(),
                r.getApprovedBy(),
                r.getAffectedBookingsCount(),
                r.getReassignedCoachId(),
                r.getCreatedAt());
    }

    private Long getUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập.");
        }
        try {
            return Long.valueOf(auth.getName());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token không hợp lệ.");
        }
    }
}
