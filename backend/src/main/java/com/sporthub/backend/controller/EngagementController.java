package com.sporthub.backend.controller;

import com.sporthub.backend.entity.AuditLog;
import com.sporthub.backend.entity.Booking;
import com.sporthub.backend.entity.ClassSession;
import com.sporthub.backend.entity.CourtMaintenance;
import com.sporthub.backend.entity.Feedback;
import com.sporthub.backend.entity.Notification;
import com.sporthub.backend.entity.SystemSetting;
import com.sporthub.backend.entity.User;
import com.sporthub.backend.repository.AuditLogRepository;
import com.sporthub.backend.repository.BookingRepository;
import com.sporthub.backend.repository.ClassSessionRepository;
import com.sporthub.backend.repository.CourtMaintenanceRepository;
import com.sporthub.backend.repository.FeedbackRepository;
import com.sporthub.backend.repository.MemberCheckInRepository;
import com.sporthub.backend.repository.NotificationRepository;
import com.sporthub.backend.repository.ReceptionPaymentRepository;
import com.sporthub.backend.repository.SportsCourtRepository;
import com.sporthub.backend.repository.SystemSettingRepository;
import com.sporthub.backend.repository.UserRepository;
import com.sporthub.backend.service.EngagementService;
import com.sporthub.backend.enums.AttendanceStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Đánh giá HLV/lớp (MEM-27, COA-15), thông báo (MEM-25, COA-16, MGR-20),
 * nhật ký hệ thống (MGR-14), lịch bảo trì sân (MGR-19),
 * báo cáo hiệu suất & hoa hồng nhân sự (MGR-11), cấu hình AI (MGR-15).
 */
@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
public class EngagementController {

    public record FeedbackRequest(Long sessionId, Integer rating, String comment) {}
    public record BroadcastRequest(String audience, String title, String message) {}
    public record MaintenanceRequest(Long courtId, LocalDateTime startTime, LocalDateTime endTime, String reason) {}

    private final FeedbackRepository feedbackRepository;
    private final BookingRepository bookingRepository;
    private final ClassSessionRepository classSessionRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final CourtMaintenanceRepository maintenanceRepository;
    private final SportsCourtRepository courtRepository;
    private final EngagementService engagementService;
    private final MemberCheckInRepository memberCheckInRepository;
    private final ReceptionPaymentRepository paymentRepository;
    private final SystemSettingRepository systemSettingRepository;
    private final com.sporthub.backend.service.FacilityCourtSyncService syncService;

    @Autowired
    public EngagementController(
            FeedbackRepository feedbackRepository,
            BookingRepository bookingRepository,
            ClassSessionRepository classSessionRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            AuditLogRepository auditLogRepository,
            CourtMaintenanceRepository maintenanceRepository,
            SportsCourtRepository courtRepository,
            EngagementService engagementService,
            MemberCheckInRepository memberCheckInRepository,
            ReceptionPaymentRepository paymentRepository,
            SystemSettingRepository systemSettingRepository,
            com.sporthub.backend.service.FacilityCourtSyncService syncService) {
        this.feedbackRepository = feedbackRepository;
        this.bookingRepository = bookingRepository;
        this.classSessionRepository = classSessionRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.maintenanceRepository = maintenanceRepository;
        this.courtRepository = courtRepository;
        this.engagementService = engagementService;
        this.memberCheckInRepository = memberCheckInRepository;
        this.paymentRepository = paymentRepository;
        this.systemSettingRepository = systemSettingRepository;
        this.syncService = syncService;
    }

    public EngagementController(
            FeedbackRepository feedbackRepository,
            BookingRepository bookingRepository,
            ClassSessionRepository classSessionRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            AuditLogRepository auditLogRepository,
            CourtMaintenanceRepository maintenanceRepository,
            SportsCourtRepository courtRepository,
            EngagementService engagementService) {
        this(feedbackRepository, bookingRepository, classSessionRepository, userRepository,
             notificationRepository, auditLogRepository, maintenanceRepository, courtRepository,
             engagementService, null, null, null, null);
    }

    // ------------------------------------------------------------------ Feedback

    /** Buổi học member đã tham dự (PRESENT) và chưa đánh giá. */
    @GetMapping("/feedbacks/eligible")
    public List<Map<String, Object>> eligibleSessions(Authentication auth) {
        requireRole(auth, "MEMBER");
        Long memberId = actorId(auth);
        Set<Long> reviewed = new HashSet<>();
        feedbackRepository.findByMemberId(memberId).forEach(f -> reviewed.add(f.getSessionId()));
        return bookingRepository.findByMemberId(memberId).stream()
                .filter(b -> AttendanceStatus.PRESENT.equals(b.getAttendanceStatus()))
                .filter(b -> !reviewed.contains(b.getSessionId()))
                .map(b -> classSessionRepository.findById(b.getSessionId()).orElse(null))
                .filter(s -> s != null)
                .map(s -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("sessionId", s.getSessionId());
                    row.put("className", s.getClassName());
                    row.put("coachId", s.getCoachId());
                    row.put("coachName", userRepository.findById(s.getCoachId()).map(User::getFullName).orElse(""));
                    row.put("startTime", s.getStartTime());
                    return row;
                })
                .toList();
    }

    @PostMapping("/feedbacks")
    @Transactional
    public Feedback submitFeedback(@RequestBody FeedbackRequest request, Authentication auth) {
        requireRole(auth, "MEMBER");
        Long memberId = actorId(auth);
        if (request == null || request.sessionId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn buổi học cần đánh giá.");
        }
        if (request.rating() == null || request.rating() < 1 || request.rating() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Điểm đánh giá phải từ 1 đến 5 sao.");
        }
        ClassSession session = classSessionRepository.findById(request.sessionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy buổi học."));
        boolean attended = bookingRepository.findByMemberId(memberId).stream()
                .anyMatch(b -> b.getSessionId().equals(session.getSessionId())
                        && AttendanceStatus.PRESENT.equals(b.getAttendanceStatus()));
        if (!attended) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Chỉ được đánh giá buổi học bạn đã tham dự (được điểm danh có mặt).");
        }
        if (feedbackRepository.existsByMemberIdAndSessionId(memberId, session.getSessionId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bạn đã đánh giá buổi học này rồi.");
        }
        String comment = request.comment() == null ? null : request.comment().trim();
        Feedback saved = feedbackRepository.save(Feedback.builder()
                .memberId(memberId)
                .sessionId(session.getSessionId())
                .coachId(session.getCoachId())
                .rating(request.rating())
                .comment(comment == null || comment.isEmpty() ? null : comment)
                .createdAt(LocalDateTime.now())
                .build());
        engagementService.notifyUser(session.getCoachId(), "Đánh giá mới từ học viên",
                "Lớp \"" + session.getClassName() + "\" nhận được " + request.rating() + "/5 sao.", "FEEDBACK");
        engagementService.audit(memberId, "MEMBER", "FEEDBACK_SUBMITTED",
                "session=" + session.getSessionId() + ", rating=" + request.rating());
        return saved;
    }

    /** HLV xem đánh giá của chính mình kèm điểm trung bình. */
    @GetMapping("/feedbacks/coach/me")
    public Map<String, Object> coachFeedbacks(Authentication auth) {
        requireRole(auth, "COACH");
        List<Feedback> list = feedbackRepository.findByCoachIdOrderByCreatedAtDesc(actorId(auth));
        double avg = list.stream().filter(f -> f.getRating() != null)
                .mapToInt(Feedback::getRating).average().orElse(0);
        List<Map<String, Object>> items = list.stream().map(f -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("feedbackId", f.getFeedbackId());
            row.put("rating", f.getRating());
            row.put("comment", f.getComment());
            row.put("createdAt", f.getCreatedAt());
            row.put("memberName", userRepository.findById(f.getMemberId()).map(User::getFullName).orElse("Học viên"));
            row.put("className", classSessionRepository.findById(f.getSessionId())
                    .map(ClassSession::getClassName).orElse(""));
            return row;
        }).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("average", Math.round(avg * 100.0) / 100.0);
        result.put("count", list.size());
        result.put("items", items);
        return result;
    }

    // ------------------------------------------------------------- Notifications

    @GetMapping({"/notifications", "/members/me/notifications"})
    public Map<String, Object> myNotifications(Authentication auth) {
        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(actorId(auth));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("unreadCount", list.stream().filter(n -> !n.isRead()).count());
        result.put("items", list);
        return result;
    }

    @PostMapping("/notifications/{id}/read")
    @Transactional
    public Map<String, Object> markRead(@PathVariable Long id, Authentication auth) {
        Notification n = notificationRepository.findById(id)
                .filter(item -> item.getUserId().equals(actorId(auth)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy thông báo."));
        n.setRead(true);
        notificationRepository.save(n);
        return Map.of("ok", true);
    }

    @PostMapping("/notifications/read-all")
    @Transactional
    public Map<String, Object> markAllRead(Authentication auth) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(actorId(auth));
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return Map.of("updated", unread.size());
    }

    /** MGR-20: gửi thông báo hàng loạt. */
    @PostMapping("/manager/broadcast")
    public Map<String, Object> broadcast(@RequestBody BroadcastRequest request, Authentication auth) {
        requireRole(auth, "MANAGER", "ADMIN");
        if (request == null || isBlank(request.title()) || isBlank(request.message())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập tiêu đề và nội dung thông báo.");
        }
        int sent = engagementService.broadcast(request.audience(), request.title().trim(), request.message().trim());
        engagementService.audit(actorId(auth), actorRole(auth), "BROADCAST_SENT",
                "audience=" + request.audience() + ", recipients=" + sent + ", title=" + request.title().trim());
        return Map.of("recipients", sent);
    }

    // ----------------------------------------------------------------- Audit log

    @GetMapping("/manager/audit-logs")
    public List<AuditLog> auditLogs(Authentication auth) {
        requireRole(auth, "MANAGER", "ADMIN");
        return auditLogRepository.findTop200ByOrderByCreatedAtDesc();
    }

    // --------------------------------------------------------------- Maintenance

    @GetMapping("/manager/courts")
    public List<Map<String, Object>> listCourts(Authentication auth) {
        requireRole(auth, "MANAGER", "ADMIN", "RECEPTIONIST");
        return courtRepository.findAll().stream().map(c -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("courtId", c.getCourtId());
            row.put("courtName", c.getCourtName());
            row.put("sportId", c.getSportId());
            row.put("active", c.isActive());
            return row;
        }).toList();
    }

    @GetMapping("/manager/maintenance")
    public List<Map<String, Object>> listMaintenance(Authentication auth) {
        requireRole(auth, "MANAGER", "ADMIN", "RECEPTIONIST");
        var courts = courtRepository.findAll().stream()
                .collect(Collectors.toMap(c -> c.getCourtId(), c -> c.getCourtName(), (a, b) -> a));
        LocalDateTime now = LocalDateTime.now();
        return maintenanceRepository.findAllByOrderByStartTimeDesc().stream().map(m -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("maintenanceId", m.getMaintenanceId());
            map.put("courtId", m.getCourtId());
            map.put("courtName", courts.getOrDefault(m.getCourtId(), "Sân #" + m.getCourtId()));
            map.put("startTime", m.getStartTime());
            map.put("endTime", m.getEndTime());
            map.put("reason", m.getReason());
            map.put("createdBy", m.getCreatedBy());
            map.put("createdAt", m.getCreatedAt());
            String status = m.getEndTime().isBefore(now) ? "COMPLETED" : (m.getStartTime().isAfter(now) ? "SCHEDULED" : "IN_PROGRESS");
            map.put("status", status);
            return map;
        }).toList();
    }

    @PatchMapping("/manager/courts/{id}/status")
    @Transactional
    public Map<String, Object> updateCourtStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication auth) {
        requireRole(auth, "MANAGER", "ADMIN");
        var court = courtRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sân."));
        boolean active = body != null && body.containsKey("active") ? Boolean.TRUE.equals(body.get("active")) : court.isActive();
        if (syncService != null) {
            syncService.syncFromCourt(id, active);
            court = courtRepository.findById(id).orElse(court);
        } else {
            court.setActive(active);
            court = courtRepository.save(court);
        }
        engagementService.audit(actorId(auth), actorRole(auth), "COURT_STATUS_UPDATED",
                "court=" + id + ", active=" + court.isActive());
        return Map.of("courtId", court.getCourtId(), "active", court.isActive(), "courtName", court.getCourtName());
    }

    @PostMapping("/manager/maintenance")
    @Transactional
    public Map<String, Object> createMaintenance(@RequestBody MaintenanceRequest request, Authentication auth) {
        requireRole(auth, "MANAGER", "ADMIN");
        if (request == null || request.courtId() == null || request.startTime() == null || request.endTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn sân và khoảng thời gian bảo trì.");
        }
        if (!request.endTime().isAfter(request.startTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời gian kết thúc phải sau thời gian bắt đầu.");
        }
        if (courtRepository.findById(request.courtId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sân.");
        }
        CourtMaintenance saved = maintenanceRepository.save(CourtMaintenance.builder()
                .courtId(request.courtId())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .reason(request.reason())
                .createdBy(actorId(auth))
                .createdAt(LocalDateTime.now())
                .build());
        if (syncService != null) {
            syncService.syncFromMaintenanceCreate(request.courtId(), request.startTime(), request.endTime(), request.reason());
        }
        engagementService.audit(actorId(auth), actorRole(auth), "MAINTENANCE_CREATED",
                "court=" + request.courtId() + ", " + request.startTime() + " -> " + request.endTime());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("maintenance", saved);
        return result;
    }

    @DeleteMapping("/manager/maintenance/{id}")
    @Transactional
    public Map<String, Object> deleteMaintenance(@PathVariable Long id, Authentication auth) {
        requireRole(auth, "MANAGER", "ADMIN");
        CourtMaintenance existing = maintenanceRepository.findById(id).orElse(null);
        if (existing == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lịch bảo trì.");
        }
        Long courtId = existing.getCourtId();
        maintenanceRepository.deleteById(id);
        if (syncService != null) {
            syncService.syncFromMaintenanceDelete(courtId);
        }
        engagementService.audit(actorId(auth), actorRole(auth), "MAINTENANCE_DELETED", "id=" + id);
        return Map.of("deleted", true);
    }

    // ------------------------------------------------------------------- Staff Performance & Commission (MGR-11)
    @GetMapping("/manager/staff-performance")
    @Transactional(readOnly = true)
    public Map<String, Object> getStaffPerformance(Authentication auth) {
        requireRole(auth, "MANAGER", "ADMIN");

        // 1. Thống kê HLV
        List<User> coaches = userRepository.findAll().stream()
                .filter(u -> "COACH".equalsIgnoreCase(u.getRole()))
                .toList();

        List<Map<String, Object>> coachStats = new ArrayList<>();
        BigDecimal totalCoachPayout = BigDecimal.ZERO;

        for (User coach : coaches) {
            List<ClassSession> sessions = classSessionRepository.findByCoachIdOrderByStartTimeAsc(coach.getUserId());
            int sessionCount = (int) sessions.stream().filter(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus())).count();
            int totalStudents = 0;
            BigDecimal coachRevenue = BigDecimal.ZERO;
            BigDecimal coachCommission = BigDecimal.ZERO;

            for (ClassSession s : sessions) {
                if ("CANCELLED".equalsIgnoreCase(s.getStatus())) {
                    continue;
                }
                List<Booking> bookings = bookingRepository.findBySessionIdInAndStatusIn(
                        List.of(s.getSessionId()), List.of("BOOKED", "CONFIRMED"));
                int students = bookings.size();
                totalStudents += students;
                BigDecimal price = s.getPriceAmount() != null ? s.getPriceAmount() : BigDecimal.valueOf(100000);
                BigDecimal sRevenue = price.multiply(BigDecimal.valueOf(students));
                coachRevenue = coachRevenue.add(sRevenue);

                BigDecimal commission = sRevenue.multiply(BigDecimal.valueOf(40)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                if (commission.compareTo(BigDecimal.valueOf(200000)) < 0) {
                    commission = BigDecimal.valueOf(200000);
                }
                coachCommission = coachCommission.add(commission);
            }

            // Đánh giá trung bình
            List<Feedback> feedbacks = feedbackRepository.findByCoachIdOrderByCreatedAtDesc(coach.getUserId());
            Double avgRating = 5.0;
            if (!feedbacks.isEmpty()) {
                double sum = feedbacks.stream().filter(f -> f.getRating() != null).mapToInt(Feedback::getRating).sum();
                long count = feedbacks.stream().filter(f -> f.getRating() != null).count();
                if (count > 0) avgRating = Math.round((sum / count) * 10.0) / 10.0;
            }

            totalCoachPayout = totalCoachPayout.add(coachCommission);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("coachId", coach.getUserId());
            row.put("fullName", coach.getFullName());
            row.put("email", coach.getEmail());
            row.put("phone", coach.getPhone());
            row.put("avatar", coach.getAvatar());
            row.put("specialty", coach.getSpecialty() != null ? coach.getSpecialty() : "Đào tạo Thể thao");
            row.put("experienceYears", coach.getExperienceYears() != null ? coach.getExperienceYears() : 5);
            row.put("sessionsCount", sessionCount);
            row.put("studentsCount", totalStudents);
            row.put("averageRating", avgRating);
            row.put("reviewsCount", feedbacks.size());
            row.put("totalRevenue", coachRevenue);
            row.put("commissionAmount", coachCommission);
            coachStats.add(row);
        }

        // 2. Thống kê Lễ tân
        List<User> receptionists = userRepository.findAll().stream()
                .filter(u -> "RECEPTIONIST".equalsIgnoreCase(u.getRole()))
                .toList();

        List<Map<String, Object>> recStats = new ArrayList<>();
        int recCount = Math.max(1, receptionists.size());

        for (User rec : receptionists) {
            int checkIns = 0;
            if (memberCheckInRepository != null) {
                checkIns = (int) memberCheckInRepository.findAll().stream()
                        .filter(c -> recCount == 1 || (c.getRecordedBy() != null && c.getRecordedBy().equals(rec.getUserId())))
                        .count();
            }
            BigDecimal posSales = BigDecimal.ZERO;
            int txCount = 0;
            if (paymentRepository != null) {
                Integer recUserId = Math.toIntExact(rec.getUserId());
                var payments = paymentRepository.findAll().stream()
                        .filter(p -> ("COMPLETED".equalsIgnoreCase(p.getPaymentStatus()) || "PAID".equalsIgnoreCase(p.getPaymentStatus()))
                                && !"REFUNDED".equalsIgnoreCase(p.getPaymentStatus())
                                && !"CANCELLED".equalsIgnoreCase(p.getPaymentStatus()))
                        .filter(p -> recCount == 1 || (p.getApprovedBy() != null && p.getApprovedBy().equals(recUserId)))
                        .toList();
                posSales = payments.stream()
                        .map(p -> p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                txCount = payments.size();
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", rec.getUserId());
            row.put("fullName", rec.getFullName());
            row.put("email", rec.getEmail());
            row.put("phone", rec.getPhone());
            row.put("avatar", rec.getAvatar());
            row.put("checkInsCount", checkIns);
            row.put("posTransactionsCount", txCount);
            row.put("totalSalesAmount", posSales);
            recStats.add(row);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("coaches", coachStats);
        result.put("receptionists", recStats);
        result.put("totalCoachPayout", totalCoachPayout);
        return result;
    }

    // ------------------------------------------------------------------- AI Configuration (MGR-15)
    @GetMapping("/manager/ai-config")
    @Transactional(readOnly = true)
    public Map<String, Object> getAiConfig(Authentication auth) {
        requireRole(auth, "MANAGER", "ADMIN");
        Map<String, Object> config = new LinkedHashMap<>();
        if (systemSettingRepository != null) {
            systemSettingRepository.findAll().forEach(s -> config.put(s.getSettingKey(), s.getSettingValue()));
        }
        if (!config.containsKey("ai_enabled")) config.put("ai_enabled", "true");
        if (!config.containsKey("ai_model")) config.put("ai_model", "gpt-4o-mini");
        if (!config.containsKey("ai_temperature")) config.put("ai_temperature", "0.7");
        if (!config.containsKey("ai_system_prompt")) {
            config.put("ai_system_prompt", "Bạn là Trợ lý AI Thể thao chuyên nghiệp của F-Sport Center. Bạn có nhiệm vụ giải đáp mọi thắc mắc của hội viên về lịch học, kỹ thuật tập luyện, dinh dưỡng thể thao và nội quy câu lạc bộ.");
        }
        return config;
    }

    @PutMapping("/manager/ai-config")
    @Transactional
    public Map<String, Object> updateAiConfig(
            @RequestBody Map<String, String> request,
            Authentication auth) {
        requireRole(auth, "MANAGER", "ADMIN");
        if (systemSettingRepository != null && request != null) {
            for (Map.Entry<String, String> entry : request.entrySet()) {
                SystemSetting setting = systemSettingRepository.findById(entry.getKey())
                        .orElse(new SystemSetting(entry.getKey(), entry.getValue(), LocalDateTime.now()));
                setting.setSettingValue(entry.getValue());
                setting.setUpdatedAt(LocalDateTime.now());
                systemSettingRepository.save(setting);
            }
        }
        engagementService.audit(actorId(auth), actorRole(auth), "UPDATE_AI_CONFIG", "Cập nhật tham số Trợ lý AI");

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("updated", true);
        res.put("config", getAiConfig(auth));
        return res;
    }

    @GetMapping("/manager/settings")
    public Map<String, Object> getSystemSettings(Authentication auth) {
        requireRole(auth, "MANAGER", "ADMIN");
        Map<String, Object> result = new LinkedHashMap<>();
        String policiesJson = systemSettingRepository != null ? systemSettingRepository.findById("SYSTEM_POLICIES")
                .map(SystemSetting::getSettingValue)
                .orElse(null) : null;
        String permissionsJson = systemSettingRepository != null ? systemSettingRepository.findById("ROLE_PERMISSIONS")
                .map(SystemSetting::getSettingValue)
                .orElse(null) : null;
        result.put("policies", policiesJson);
        result.put("permissions", permissionsJson);
        return result;
    }

    @PutMapping("/manager/settings")
    @Transactional
    public Map<String, Object> updateSystemSettings(
            @RequestBody Map<String, Object> request,
            Authentication auth) {
        requireRole(auth, "MANAGER", "ADMIN");
        if (systemSettingRepository != null && request != null) {
            tools.jackson.databind.ObjectMapper mapper = new tools.jackson.databind.ObjectMapper();
            if (request.containsKey("policies") && request.get("policies") != null) {
                try {
                    Object p = request.get("policies");
                    String pStr = p instanceof String ? (String) p : mapper.writeValueAsString(p);
                    SystemSetting setting = systemSettingRepository.findById("SYSTEM_POLICIES")
                            .orElse(new SystemSetting("SYSTEM_POLICIES", pStr, LocalDateTime.now()));
                    setting.setSettingValue(pStr);
                    setting.setUpdatedAt(LocalDateTime.now());
                    systemSettingRepository.save(setting);
                } catch (Exception ignored) {}
            }
            if (request.containsKey("permissions") && request.get("permissions") != null) {
                try {
                    Object p = request.get("permissions");
                    String pStr = p instanceof String ? (String) p : mapper.writeValueAsString(p);
                    SystemSetting setting = systemSettingRepository.findById("ROLE_PERMISSIONS")
                            .orElse(new SystemSetting("ROLE_PERMISSIONS", pStr, LocalDateTime.now()));
                    setting.setSettingValue(pStr);
                    setting.setUpdatedAt(LocalDateTime.now());
                    systemSettingRepository.save(setting);
                } catch (Exception ignored) {}
            }
        }
        if (engagementService != null) {
            engagementService.audit(actorId(auth), actorRole(auth), "UPDATE_SETTINGS", "Cập nhật chính sách & phân quyền hệ thống");
        }
        return getSystemSettings(auth);
    }

    // ------------------------------------------------------------------- helpers

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private Long actorId(Authentication auth) {
        try {
            return Long.valueOf(auth.getName());
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ.");
        }
    }

    private String actorRole(Authentication auth) {
        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring("ROLE_".length()))
                .findFirst()
                .orElse("");
    }

    private void requireRole(Authentication auth, String... allowed) {
        String role = actorRole(auth);
        for (String candidate : allowed) {
            if (candidate.equals(role)) {
                return;
            }
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Vai trò tài khoản không được phép thực hiện thao tác này.");
    }
}
