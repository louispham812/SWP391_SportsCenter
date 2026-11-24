package com.sporthub.backend.controller;

import com.sporthub.backend.dto.CoachLeaveRequestDTO;
import com.sporthub.backend.dto.CreateLeaveRequest;
import com.sporthub.backend.dto.LeaveDecisionRequest;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.CoachLeaveRequest;
import com.sporthub.backend.entity.Sport;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CoachLeaveRequestRepository;
import com.sporthub.backend.repository.SportRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.service.EngagementService;
import com.sporthub.backend.util.CoachSportHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@RestController
@CrossOrigin(origins = "*")
public class CoachLeaveController {

    private final CoachLeaveRequestRepository leaveRepository;
    private final UserRepository userRepository;
    private final ClassSessionRepository classSessionRepository;
    private final BookingRepository bookingRepository;
    private final EngagementService engagementService;
    @Autowired(required = false) private com.sporthub.backend.service.CoachAvailabilityService availability;
    @Autowired(required = false) private com.sporthub.backend.repository.PublicSportRepository sports;
    @Autowired(required = false) private SportRepository sportRepository;

    @Autowired
    public CoachLeaveController(
            CoachLeaveRequestRepository leaveRepository,
            UserRepository userRepository,
            ClassSessionRepository classSessionRepository,
            BookingRepository bookingRepository,
            EngagementService engagementService) {
        this.leaveRepository = leaveRepository;
        this.userRepository = userRepository;
        this.classSessionRepository = classSessionRepository;
        this.bookingRepository = bookingRepository;
        this.engagementService = engagementService;
    }

    public CoachLeaveController(
            CoachLeaveRequestRepository leaveRepository,
            UserRepository userRepository,
            ClassSessionRepository classSessionRepository,
            BookingRepository bookingRepository) {
        this(leaveRepository, userRepository, classSessionRepository, bookingRepository, null);
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
        if (req.startDate().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày bắt đầu nghỉ không được ở trong quá khứ.");
        }
        if (req.endDate().isBefore(req.startDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày kết thúc không được trước ngày bắt đầu.");
        }
        boolean hasOverlapLeave = leaveRepository.findByCoachIdOrderByCreatedAtDesc(coachId).stream()
                .filter(existing -> existing.getStatus() != null
                        && ("PENDING".equalsIgnoreCase(existing.getStatus())
                                || "APPROVED".equalsIgnoreCase(existing.getStatus())))
                .anyMatch(existing -> existing.getStartDate() != null && existing.getEndDate() != null
                        && !existing.getEndDate().isBefore(req.startDate())
                        && !existing.getStartDate().isAfter(req.endDate()));
        if (hasOverlapLeave) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bạn đã có đơn xin nghỉ trùng hoặc chồng lấn trong khoảng thời gian này.");
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

        CoachLeaveRequest saved = leaveRepository.save(request);

        // Audit log: Coach tạo đơn xin nghỉ
        if (engagementService != null) {
            engagementService.audit(
                    coachId,
                    "COACH",
                    "COACH_LEAVE_REQUEST_CREATED",
                    "requestId=" + saved.getRequestId() +
                            ", leaveType=" + saved.getLeaveType() +
                            ", startDate=" + saved.getStartDate() +
                            ", endDate=" + saved.getEndDate() +
                            ", reason=" + saved.getReason() +
                            ", affectedBookingsCount=" + saved.getAffectedBookingsCount()
            );

            // Thông báo tất cả Manager có đơn mới cần duyệt
            notifyManagersAboutNewLeaveRequest(coach, saved);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(saved));
    }

    @GetMapping("/api/v1/manager/coach-leave-requests")
    @Transactional(readOnly = true)
    public ResponseEntity<List<CoachLeaveRequestDTO>> getAllLeaveRequestsForManager() {
        List<CoachLeaveRequest> requests = leaveRepository.findAllByOrderByCreatedAtDesc();
        if (requests.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        List<ClassSession> allSessions = classSessionRepository.findAll();
        Map<Long, Sport> sportMap = loadSportMap();
        List<CoachLeaveRequestDTO> result = requests.stream()
                .map(r -> toDTO(r, buildAffectedSessionDTOs(r, allSessions, sportMap)))
                .toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/api/v1/manager/coach-leave-requests/{id}/decision")
    @Transactional
    public ResponseEntity<CoachLeaveRequestDTO> decideLeaveRequest(
            @PathVariable Long id,
            @RequestBody LeaveDecisionRequest decision,
            Authentication auth) {
        CoachLeaveRequest req = leaveRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu nghỉ."));

        if (!"PENDING".equals(req.getStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Đơn nghỉ đã được xử lý.");
        if (!decision.approved() && (decision.decisionNote() == null || decision.decisionNote().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Từ chối yêu cầu nghỉ phép phải ghi rõ lý do (BR-16)");
        }

        Long managerId = getUserId(auth);

        if (decision.approved()) {
            List<ClassSession> sessionsToReassign = findAffectedSessions(req, classSessionRepository.findAll());
            if (!sessionsToReassign.isEmpty()) {
                Map<Long, Sport> sportMap = loadSportMap();
                Map<Long, User> resolvedCoaches = new LinkedHashMap<>();
                Map<Long, User> sessionCoaches = new LinkedHashMap<>();
                Set<String> newCoachLabels = new LinkedHashSet<>();
                Long primaryReplacementId = decision.reassignedCoachId();
                Map<Long, List<ClassSession>> batchAssignedByCoach = new LinkedHashMap<>();

                for (ClassSession s : sessionsToReassign) {
                    Long targetCoachId = (decision.sessionReassignments() != null
                            && decision.sessionReassignments().get(s.getSessionId()) != null)
                            ? decision.sessionReassignments().get(s.getSessionId())
                            : decision.reassignedCoachId();
                    if (targetCoachId == null) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "Cần chọn HLV thay thế cho các ca bị ảnh hưởng.");
                    }
                    User replacementCoach = resolvedCoaches.get(targetCoachId);
                    if (replacementCoach == null) {
                        replacementCoach = userRepository.findByIdForUpdate(targetCoachId)
                                .filter(u -> "COACH".equalsIgnoreCase(u.getRole())
                                        && "ACTIVE".equalsIgnoreCase(u.getStatus())
                                        && !Objects.equals(u.getUserId(), req.getCoachId()))
                                .orElseThrow(() -> new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST, "Huấn luyện viên thay thế không hợp lệ."));
                        resolvedCoaches.put(targetCoachId, replacementCoach);
                    }
                    if (primaryReplacementId == null) {
                        primaryReplacementId = replacementCoach.getUserId();
                    }
                    if (classSessionRepository.existsOverlappingSessionForCoach(
                            replacementCoach.getUserId(), s.getStartTime(), s.getEndTime())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "HLV thay thế đã có lịch trùng giờ.");
                    }
                    List<ClassSession> prevAssigned = batchAssignedByCoach.computeIfAbsent(
                            replacementCoach.getUserId(), k -> new java.util.ArrayList<>());
                    boolean intraBatchConflict = prevAssigned.stream().anyMatch(prev ->
                            s.getStartTime() != null && prev.getEndTime() != null
                                    && s.getEndTime() != null && prev.getStartTime() != null
                                    && s.getStartTime().isBefore(prev.getEndTime())
                                    && s.getEndTime().isAfter(prev.getStartTime()));
                    if (intraBatchConflict) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "HLV thay thế bị trùng giờ giữa các ca dạy được phân công trong cùng đơn nghỉ.");
                    }
                    prevAssigned.add(s);
                    if (availability != null) {
                        availability.requireAvailable(replacementCoach, s.getStartTime(), s.getEndTime());
                    }
                    if (s.getSportId() != null) {
                        Sport targetSport = sportMap.get(s.getSportId());
                        if (targetSport == null) {
                            targetSport = new Sport();
                            targetSport.setSportId(s.getSportId());
                        }
                        if (!CoachSportHelper.teachesSport(replacementCoach, targetSport)) {
                            String sportLabel = targetSport.getSportName() != null && !targetSport.getSportName().isBlank()
                                    ? " " + targetSport.getSportName()
                                    : "";
                            throw new ResponseStatusException(
                                    HttpStatus.CONFLICT,
                                    "HLV thay thế chưa có chuyên môn phù hợp bộ môn" + sportLabel + ".");
                        }
                    }
                    sessionCoaches.put(s.getSessionId(), replacementCoach);
                    newCoachLabels.add(replacementCoach.getFullName() + "(" + replacementCoach.getUserId() + ")");
                }

                for (ClassSession s : sessionsToReassign) {
                    s.setCoachId(sessionCoaches.get(s.getSessionId()).getUserId());
                }
                classSessionRepository.saveAll(sessionsToReassign);
                req.setReassignedCoachId(primaryReplacementId);

                if (engagementService != null) {
                    engagementService.audit(managerId, "MANAGER", "COACH_LEAVE_REASSIGNED",
                            "requestId=" + id + ", oldCoach=" + req.getCoachName() + "(" + req.getCoachId() + ")"
                                    + ", newCoach=" + String.join("; ", newCoachLabels)
                                    + ", reassignedSessionsCount=" + sessionsToReassign.size());

                    Map<Long, User> bookingCoachBySession = sessionCoaches;
                    List<Long> sessionIds = sessionsToReassign.stream().map(ClassSession::getSessionId).toList();
                    if (!sessionIds.isEmpty() && bookingRepository != null) {
                        List<com.sporthub.backend.entity.Booking> affectedBookings =
                                bookingRepository.findBySessionIdInAndStatusIn(sessionIds, List.of("BOOKED", "CONFIRMED"));
                        for (com.sporthub.backend.entity.Booking b : affectedBookings) {
                            User newCoach = bookingCoachBySession.get(b.getSessionId());
                            String coachDisplay = newCoach != null ? newCoach.getFullName() : "thay thế";
                            engagementService.notifyUser(
                                    b.getMemberId(),
                                    "Thay đổi Huấn luyện viên",
                                    "Lớp học của bạn đã được chuyển cho HLV " + coachDisplay + " phụ trách theo kế hoạch.",
                                    "SCHEDULE");
                        }
                    }
                }
            } else if (decision.reassignedCoachId() != null) {
                User replacementCoach = userRepository.findByIdForUpdate(decision.reassignedCoachId())
                        .filter(u -> "COACH".equalsIgnoreCase(u.getRole())
                                && "ACTIVE".equalsIgnoreCase(u.getStatus())
                                && !Objects.equals(u.getUserId(), req.getCoachId()))
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.BAD_REQUEST, "Huấn luyện viên thay thế không hợp lệ."));
                req.setReassignedCoachId(replacementCoach.getUserId());
            }
        } else if (decision.reassignedCoachId() != null) {
            req.setReassignedCoachId(decision.reassignedCoachId());
        }

        req.setStatus(decision.approved() ? "APPROVED" : "REJECTED");
        req.setApprovedBy(managerId);

        CoachLeaveRequest savedRequest = leaveRepository.save(req);

        // Thông báo Coach về kết quả duyệt đơn
        if (engagementService != null) {
            notifyCoachAboutDecision(savedRequest, decision);
        }

        // Audit log khi từ chối đơn
        if (!decision.approved() && engagementService != null) {
            engagementService.audit(
                    managerId,
                    "MANAGER",
                    "COACH_LEAVE_REJECTED",
                    "requestId=" + id +
                            ", coachId=" + req.getCoachId() +
                            ", coachName=" + req.getCoachName() +
                            ", rejectReason=" + (decision.decisionNote() != null ? decision.decisionNote() : "N/A")
            );
        }

        return ResponseEntity.ok(toDTO(savedRequest));
    }

    private CoachLeaveRequestDTO toDTO(CoachLeaveRequest r) {
        return toDTO(r, List.of());
    }

    private CoachLeaveRequestDTO toDTO(
            CoachLeaveRequest r,
            List<CoachLeaveRequestDTO.AffectedSessionDTO> affectedSessions) {
        String approvedByName = r.getApprovedBy() == null ? null
                : userRepository.findById(r.getApprovedBy()).map(User::getFullName).orElse(null);
        String reassignedCoachName = r.getReassignedCoachId() == null ? null
                : userRepository.findById(r.getReassignedCoachId()).map(User::getFullName).orElse(null);
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
                r.getCreatedAt(),
                affectedSessions != null ? affectedSessions : List.of(),
                approvedByName,
                reassignedCoachName);
    }

    private List<ClassSession> findAffectedSessions(CoachLeaveRequest req, List<ClassSession> allSessions) {
        if (req == null || req.getCoachId() == null || req.getStartDate() == null || req.getEndDate() == null) {
            return List.of();
        }
        LocalDateTime startDt = req.getStartDate().atStartOfDay();
        LocalDateTime endDt = req.getEndDate().plusDays(1).atStartOfDay();
        List<ClassSession> source = allSessions != null && !allSessions.isEmpty()
                ? allSessions
                : classSessionRepository.findByCoachIdOrderByStartTimeAsc(req.getCoachId());
        return source.stream()
                .filter(s -> Objects.equals(s.getCoachId(), req.getCoachId()))
                .filter(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                .filter(s -> s.getStartTime() != null && !s.getStartTime().isBefore(startDt) && s.getStartTime().isBefore(endDt))
                .sorted(Comparator.comparing(ClassSession::getStartTime))
                .toList();
    }

    private List<CoachLeaveRequestDTO.AffectedSessionDTO> buildAffectedSessionDTOs(
            CoachLeaveRequest req,
            List<ClassSession> allSessions,
            Map<Long, Sport> sportMap) {
        return findAffectedSessions(req, allSessions).stream()
                .map(s -> {
                    Sport sport = s.getSportId() != null ? sportMap.get(s.getSportId()) : null;
                    String sportName = sport != null ? sport.getSportName() : null;
                    return new CoachLeaveRequestDTO.AffectedSessionDTO(
                            s.getSessionId(),
                            s.getClassName(),
                            s.getSportId(),
                            sportName,
                            s.getStartTime(),
                            s.getEndTime(),
                            s.getBookedSlots(),
                            s.getMaxSlots(),
                            s.getStatus());
                })
                .toList();
    }

    private Map<Long, Sport> loadSportMap() {
        Map<Long, Sport> map = new LinkedHashMap<>();
        if (sportRepository != null) {
            for (Sport sport : sportRepository.findAllByOrderBySportIdAsc()) {
                if (sport != null && sport.getSportId() != null) {
                    map.put(sport.getSportId(), sport);
                }
            }
        }
        if (sports != null) {
            for (com.sporthub.backend.entity.PublicSport ps : sports.findAll()) {
                if (ps != null && ps.getSportId() != null && !map.containsKey(ps.getSportId())) {
                    Sport fallback = new Sport();
                    fallback.setSportId(ps.getSportId());
                    fallback.setSportName(ps.getName());
                    map.put(ps.getSportId(), fallback);
                }
            }
        }
        return map;
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

    /**
     * Thông báo tất cả Manager khi có đơn xin nghỉ mới (Issue #3)
     */
    private void notifyManagersAboutNewLeaveRequest(User coach, CoachLeaveRequest request) {
        try {
            List<User> managers = userRepository.findAll().stream()
                    .filter(u -> "MANAGER".equalsIgnoreCase(u.getRole()) || "ADMIN".equalsIgnoreCase(u.getRole()))
                    .filter(u -> "ACTIVE".equalsIgnoreCase(u.getStatus()))
                    .toList();

            for (User manager : managers) {
                engagementService.notifyUser(
                        manager.getUserId(),
                        "Đơn xin nghỉ mới cần duyệt",
                        "HLV " + coach.getFullName() + " xin nghỉ từ " +
                                request.getStartDate() + " đến " + request.getEndDate() +
                                ". Có " + request.getAffectedBookingsCount() + " ca học bị ảnh hưởng. Vui lòng duyệt và chọn HLV thay thế.",
                        "APPROVAL_NEEDED"
                );
            }
        } catch (Exception e) {
            // Không làm hỏng nghiệp vụ chính
        }
    }

    /**
     * Thông báo Coach về kết quả duyệt đơn (Issue #4)
     */
    private void notifyCoachAboutDecision(CoachLeaveRequest request, LeaveDecisionRequest decision) {
        try {
            if (decision.approved()) {
                engagementService.notifyUser(
                        request.getCoachId(),
                        "Đơn nghỉ được chấp thuận",
                        "Đơn xin nghỉ từ " + request.getStartDate() + " đến " + request.getEndDate() +
                                " đã được duyệt. Các lớp học của bạn đã được chuyển cho HLV thay thế. Cảm ơn bạn đã thông báo trước.",
                        "APPROVAL_RESULT"
                );
            } else {
                String rejectReason = decision.decisionNote() != null && !decision.decisionNote().isBlank()
                        ? decision.decisionNote()
                        : "Lịch giảng dạy quá kín, không đủ HLV thay thế";

                engagementService.notifyUser(
                        request.getCoachId(),
                        "Đơn nghỉ bị từ chối",
                        "Đơn xin nghỉ từ " + request.getStartDate() + " đến " + request.getEndDate() +
                                " không được chấp thuận. Lý do: " + rejectReason + ". Vui lòng liên hệ Ban Quản lý nếu cần hỗ trợ.",
                        "APPROVAL_RESULT"
                );
            }
        } catch (Exception e) {
            // Không làm hỏng nghiệp vụ chính
        }
    }
}
